import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface Chunk {
  id: number;
  chunk_index: number;
  text: string;
  label: string;
}

interface Document {
  id: number;
  name: string;
  chunk_count: number;
}

const DocumentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [editedTexts, setEditedTexts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingChunkId, setSavingChunkId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(async () => {
    try {
      const [docRes, chunksRes] = await Promise.all([
        axios.get<Document>(`http://localhost:3001/api/documents/${id}`),
        axios.get<Chunk[]>(`http://localhost:3001/api/documents/${id}/chunks`),
      ]);
      setDocument(docRes.data);
      setChunks(chunksRes.data);
      setEditedTexts({});
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTextChange = (chunkId: number, newText: string) => {
    setEditedTexts((prev) => ({ ...prev, [chunkId]: newText }));
  };

  const handleSave = async (chunk: Chunk) => {
    const newText = editedTexts[chunk.id];
    if (newText === undefined || newText === chunk.text) return;

    setSavingChunkId(chunk.id);
    try {
      await axios.patch(`http://localhost:3001/api/documents/${id}/chunks/${chunk.id}`, {
        text: newText,
      });
      // Update local state so the chunk reflects the saved text
      setChunks((prev) =>
        prev.map((c) => (c.id === chunk.id ? { ...c, text: newText } : c))
      );
      setEditedTexts((prev) => {
        const next = { ...prev };
        delete next[chunk.id];
        return next;
      });
      setSnackbar({ open: true, message: `${chunk.label} saved`, severity: 'success' });
    } catch (error) {
      console.error('Failed to save chunk:', error);
      setSnackbar({ open: true, message: 'Failed to save', severity: 'error' });
    } finally {
      setSavingChunkId(null);
    }
  };

  const isModified = (chunkId: number, originalText: string) => {
    return editedTexts[chunkId] !== undefined && editedTexts[chunkId] !== originalText;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!document) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Document not found.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/documents')} sx={{ mt: 2 }}>
          Back to Documents
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/documents')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          Edit: {document.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {chunks.length} passage{chunks.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {chunks.map((chunk) => {
          const currentText = editedTexts[chunk.id] ?? chunk.text;
          const modified = isModified(chunk.id, chunk.text);
          const saving = savingChunkId === chunk.id;

          return (
            <Paper key={chunk.id} elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {chunk.label}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={() => handleSave(chunk)}
                  disabled={!modified || saving}
                >
                  Save
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={12}
                value={currentText}
                onChange={(e) => handleTextChange(chunk.id, e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderColor: modified ? 'warning.main' : undefined,
                  },
                }}
              />
            </Paper>
          );
        })}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DocumentEdit;
