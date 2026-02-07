import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: number;
  name: string;
  original_filename: string;
  file_type: string;
  chunk_count: number;
  uploaded_at: string;
}

const ACCEPTED_TYPES = '.pdf,.txt,.json,.docx,.xlsx,.csv,.md,.html';

const DocumentUpload: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await axios.get<Document[]>('http://localhost:3001/api/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post('http://localhost:3001/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchDocuments();
    } catch (error: any) {
      const message = error.response?.data?.details || error.response?.data?.error || 'Upload failed';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handlePractice = async (doc: Document) => {
    try {
      await axios.post('http://localhost:3001/api/settings', {
        activeSourceText: String(doc.id),
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to set active source:', error);
    }
  };

  const handleDeleteClick = (doc: Document) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoc) return;
    try {
      await axios.delete(`http://localhost:3001/api/documents/${selectedDoc.id}`);
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
    setDeleteDialogOpen(false);
    setSelectedDoc(null);
  };

  const handleRenameClick = (doc: Document) => {
    setSelectedDoc(doc);
    setNewName(doc.name);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!selectedDoc || !newName.trim()) return;
    try {
      await axios.patch(`http://localhost:3001/api/documents/${selectedDoc.id}`, {
        name: newName.trim(),
      });
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to rename document:', error);
    }
    setRenameDialogOpen(false);
    setSelectedDoc(null);
    setNewName('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'Z').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload documents to practice typing with custom content. Supported formats: PDF, TXT, JSON, DOCX, XLSX, CSV, MD, HTML.
        </Typography>

        {/* Upload Area */}
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'grey.400',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: dragOver ? 'action.hover' : 'transparent',
            cursor: 'pointer',
            mb: 3,
            transition: 'all 0.2s',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={ACCEPTED_TYPES}
            style={{ display: 'none' }}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
          <Typography variant="body1">
            Drag & drop a file here, or click to browse
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max file size: 10MB
          </Typography>
        </Box>

        {uploading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Document List */}
        {documents.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No documents uploaded yet.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {documents.map((doc) => (
              <Card key={doc.id} variant="outlined">
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <UploadFileIcon color="action" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                      {doc.name}
                    </Typography>
                    <Chip
                      label={doc.file_type.toUpperCase().replace('.', '')}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {doc.chunk_count} passage{doc.chunk_count !== 1 ? 's' : ''} &middot; Uploaded {formatDate(doc.uploaded_at)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handlePractice(doc)}
                  >
                    Practice
                  </Button>
                  <IconButton size="small" onClick={() => handleRenameClick(doc)} title="Rename">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(doc)} title="Delete" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedDoc?.name}"? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Document Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameConfirm} variant="contained" disabled={!newName.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentUpload;
