import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { requireAuth } from '../_lib/auth';
import { insertDocumentWithChunks, getDocument } from '../_lib/db';
import { extractText } from '../_lib/textExtractor';
import { chunkText } from '../_lib/textChunker';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseMultipart(req: VercelRequest): Promise<{ filePath: string; originalName: string; ext: string }> {
  const Busboy = (await import('busboy')).default;

  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    let filePath = '';
    let originalName = '';

    busboy.on('file', (_fieldname, file, info) => {
      originalName = info.filename;
      const ext = path.extname(originalName).toLowerCase();
      const tmpPath = path.join(os.tmpdir(), `upload-${Date.now()}${ext}`);
      filePath = tmpPath;
      const writeStream = fs.createWriteStream(tmpPath);
      file.pipe(writeStream);
    });

    busboy.on('finish', () => {
      if (!filePath) {
        reject(new Error('No file uploaded'));
        return;
      }
      const ext = path.extname(originalName).toLowerCase();
      resolve({ filePath, originalName, ext });
    });

    busboy.on('error', reject);
    req.pipe(busboy as any);
  });
}

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.json', '.docx', '.xlsx', '.csv', '.md', '.html'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let filePath = '';

  try {
    const auth = requireAuth(req);

    const { filePath: fp, originalName, ext } = await parseMultipart(req);
    filePath = fp;

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ error: `Unsupported file type: ${ext}` });
    }

    const text = await extractText(filePath, ext);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract any text from the file' });
    }

    const chunks = chunkText(text);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No text chunks could be created from the file' });
    }

    const name = path.basename(originalName);
    const docId = await insertDocumentWithChunks(auth.userId, name, originalName, ext, chunks);
    const doc = await getDocument(docId, auth.userId);

    res.status(201).json(doc);
  } catch (error: any) {
    if (error.statusCode === 401) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Error uploading document:', error);
    res.status(500).json({
      error: 'Failed to process uploaded file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
