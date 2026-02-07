export function chunkText(text: string): Array<{ text: string; label: string }> {
  // Split by double newlines into paragraphs
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 0);

  const chunks: Array<{ text: string; label: string }> = [];
  let paragraphNumber = 1;

  for (const paragraph of paragraphs) {
    if (paragraph.length > 500) {
      // Split long paragraphs by sentence boundaries
      const sentences = paragraph.match(/[^.!?]+[.!?]+\s*/g) || [paragraph];
      let currentChunk = '';

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > 500 && currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            label: `Paragraph ${paragraphNumber}`,
          });
          paragraphNumber++;
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          label: `Paragraph ${paragraphNumber}`,
        });
        paragraphNumber++;
      }
    } else {
      chunks.push({
        text: paragraph,
        label: `Paragraph ${paragraphNumber}`,
      });
      paragraphNumber++;
    }
  }

  return chunks;
}
