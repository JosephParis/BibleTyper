import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  insertDocumentWithChunks,
  getDocuments,
  getDocument,
  deleteDocument,
  renameDocument,
  getRandomDocumentChunk,
  getSettings,
  updateSetting,
} from '../db';
import { extractText } from '../services/textExtractor';
import { chunkText } from '../services/textChunker';

const router = express.Router();

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.json', '.docx', '.xlsx', '.csv', '.md', '.html'];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
  },
});

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalFilename = req.file.originalname;
    const ext = path.extname(originalFilename).toLowerCase();

    // Extract text from file
    const text = await extractText(filePath, ext);

    // Clean up temp file
    fs.unlinkSync(filePath);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract any text from the file' });
    }

    // Chunk the text
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No text chunks could be created from the file' });
    }

    // Store in database
    const name = path.basename(originalFilename);
    const docId = insertDocumentWithChunks(name, originalFilename, ext, chunks);
    const doc = getDocument(docId);

    res.status(201).json(doc);
  } catch (error) {
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading document:', error);
    res.status(500).json({
      error: 'Failed to process uploaded file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/documents
router.get('/', (_req, res) => {
  try {
    const documents = getDocuments();
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:id
router.get('/:id', (req, res) => {
  try {
    const doc = getDocument(parseInt(req.params.id));
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // If this was the active source text, reset to bible
    const settings = getSettings();
    if (settings.activeSourceText === String(id)) {
      updateSetting('activeSourceText', 'bible');
    }

    const deleted = deleteDocument(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// PATCH /api/documents/:id
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const renamed = renameDocument(id, name.trim());
    if (!renamed) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = getDocument(id);
    res.json(doc);
  } catch (error) {
    console.error('Error renaming document:', error);
    res.status(500).json({ error: 'Failed to rename document' });
  }
});

// GET /api/documents/:id/random
router.get('/:id/random', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const doc = getDocument(id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const chunk = getRandomDocumentChunk(id);

    if (!chunk) {
      return res.status(404).json({ error: 'No chunks found for this document' });
    }

    // Return in same shape as verse response
    const response = [{
      id: chunk.id,
      text: chunk.text,
      reference: chunk.label,
      sourceText: chunk.document_name,
    }];

    res.json(response);
  } catch (error) {
    console.error('Error fetching random document chunk:', error);
    res.status(500).json({ error: 'Failed to fetch random chunk' });
  }
});

export const documentRoutes = router;
