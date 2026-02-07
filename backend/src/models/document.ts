export interface Document {
  id: number;
  name: string;
  original_filename: string;
  file_type: string;
  chunk_count: number;
  uploaded_at: string;
}

export interface DocumentChunk {
  id: number;
  document_id: number;
  chunk_index: number;
  text: string;
  label: string;
}
