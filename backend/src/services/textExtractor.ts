import fs from 'fs';
import path from 'path';

export async function extractText(filePath: string, fileType: string): Promise<string> {
  const ext = fileType.toLowerCase();

  switch (ext) {
    case '.txt':
    case '.md':
      return fs.readFileSync(filePath, 'utf-8');

    case '.json': {
      const raw = fs.readFileSync(filePath, 'utf-8');
      try {
        const parsed = JSON.parse(raw);
        return extractJsonText(parsed);
      } catch {
        return raw;
      }
    }

    case '.pdf': {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    }

    case '.docx': {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    case '.xlsx':
    case '.csv': {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath);
      const texts: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        texts.push(csv);
      }
      return texts.join('\n\n');
    }

    case '.html': {
      const html = fs.readFileSync(filePath, 'utf-8');
      // Strip HTML tags
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

function extractJsonText(obj: any): string {
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map(extractJsonText).join('\n');
  if (typeof obj === 'object' && obj !== null) {
    // Prioritize text/content fields
    for (const key of ['text', 'content', 'body', 'message', 'description']) {
      if (typeof obj[key] === 'string') return obj[key];
    }
    return Object.values(obj).map(extractJsonText).join('\n');
  }
  return String(obj);
}
