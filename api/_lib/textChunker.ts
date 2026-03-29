/**
 * Clean extracted text by removing common artifacts from PDFs and documents:
 * - Page numbers (standalone numbers, "Page X", "- X -", etc.)
 * - Headers/footers that repeat across pages
 * - Excessive whitespace
 */
function cleanText(text: string): string {
  const lines = text.split('\n');

  const cleaned = lines
    .map(line => line.trim())
    // Remove standalone page numbers: "1", "- 2 -", "Page 3", "pg. 4", etc.
    .filter(line => !/^\s*[-–—]?\s*\d+\s*[-–—]?\s*$/.test(line))
    .filter(line => !/^\s*(page|pg\.?)\s*\d+\s*$/i.test(line))
    // Remove very short lines that look like headers/footers (all caps, under 60 chars, no sentence ending)
    .filter(line => {
      if (line.length === 0) return true; // keep blank lines as paragraph separators
      if (line.length < 5 && !/[a-zA-Z]/.test(line)) return false; // remove tiny non-alpha lines
      return true;
    });

  return cleaned.join('\n');
}

/**
 * Split text into chunks suitable for typing practice.
 * - Splits on double newlines (paragraphs)
 * - Treats bullet points / list items as individual chunks
 * - Splits long paragraphs at sentence boundaries
 * - Cleans up PDF artifacts before chunking
 */
export function chunkText(text: string): Array<{ text: string; label: string }> {
  const cleaned = cleanText(text);

  // Split into raw blocks on double newlines
  const rawBlocks = cleaned
    .split(/\n\n+/)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  // Further split blocks that contain bullet points or numbered lists
  const blocks: string[] = [];
  for (const block of rawBlocks) {
    // Check if block contains bullet/list items (lines starting with -, *, •, or 1. 2. etc.)
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const bulletPattern = /^(?:[-*•]\s|(?:\d+[.)]\s)|(?:[a-zA-Z][.)]\s))/;

    const hasBullets = lines.some(l => bulletPattern.test(l));

    if (hasBullets && lines.length > 1) {
      // Split: non-bullet lines group together, each bullet is its own chunk
      let nonBulletBuffer = '';
      for (const line of lines) {
        if (bulletPattern.test(line)) {
          if (nonBulletBuffer.trim()) {
            blocks.push(nonBulletBuffer.trim());
            nonBulletBuffer = '';
          }
          // Clean the bullet marker and add as its own block
          const bulletText = line.replace(bulletPattern, '').trim();
          if (bulletText.length > 0) {
            blocks.push(bulletText);
          }
        } else {
          nonBulletBuffer += (nonBulletBuffer ? ' ' : '') + line;
        }
      }
      if (nonBulletBuffer.trim()) {
        blocks.push(nonBulletBuffer.trim());
      }
    } else {
      // Regular paragraph: collapse internal newlines to spaces
      blocks.push(lines.join(' '));
    }
  }

  // Now chunk blocks, splitting long ones at sentence boundaries
  const chunks: Array<{ text: string; label: string }> = [];
  let chunkNumber = 1;

  for (const block of blocks) {
    const normalizedBlock = block.replace(/\s+/g, ' ').trim();
    if (normalizedBlock.length === 0) continue;

    if (normalizedBlock.length > 500) {
      // Split at sentence boundaries
      const sentences = normalizedBlock.match(/[^.!?]+[.!?]+\s*/g) || [normalizedBlock];
      let currentChunk = '';

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > 500 && currentChunk.length > 0) {
          chunks.push({ text: currentChunk.trim(), label: `Passage ${chunkNumber}` });
          chunkNumber++;
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push({ text: currentChunk.trim(), label: `Passage ${chunkNumber}` });
        chunkNumber++;
      }
    } else {
      chunks.push({ text: normalizedBlock, label: `Passage ${chunkNumber}` });
      chunkNumber++;
    }
  }

  return chunks;
}
