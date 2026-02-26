/**
 * Inline multipart/form-data parser for single file 'avatar'
 */
export const parseAvatarMultipart = (req, res, next) => {
  const chunks = [];
  let totalLength = 0;
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB

  req.on('data', chunk => {
    chunks.push(chunk);
    totalLength += chunk.length;
    if (totalLength > MAX_SIZE + 1024 * 500) { // Add 500KB for headers padding
      req.destroy(); // stop receiving
      res.status(400).json({ success: false, message: 'Kích thước file không được vượt quá 2MB' });
    }
  });

  req.on('end', () => {
    if (res.headersSent) return; // Already replied due to size

    try {
      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) {
        return res.status(400).json({ success: false, message: 'Empty body' });
      }
      
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('multipart/form-data')) {
        return res.status(400).json({ success: false, message: 'Must be multipart/form-data' });
      }

      const boundaryMatch = contentType.match(/boundary=(.+)$/);
      if (!boundaryMatch) {
        return res.status(400).json({ success: false, message: 'No boundary found' });
      }
      
      const boundary = boundaryMatch[1];
      const boundaryBuffer = Buffer.from('--' + boundary);
      
      let index = buffer.indexOf(boundaryBuffer);
      if (index === -1) {
        return res.status(400).json({ success: false, message: 'Invalid multipart format' });
      }
      
      // Look for the part named 'avatar'
      while (index !== -1) {
        // Find next boundary
        const nextIndex = buffer.indexOf(boundaryBuffer, index + boundaryBuffer.length);
        if (nextIndex === -1) break;
        
        // Extract the part between this boundary and the next boundary
        const partStart = index + boundaryBuffer.length + 2; // \r\n
        let partEnd = nextIndex - 2; // \r\n before next boundary
        
        if (partStart >= partEnd) {
          index = nextIndex;
          continue;
        }
        
        const part = buffer.subarray(partStart, partEnd);
        const headerEndIndex = part.indexOf(Buffer.from('\r\n\r\n'));
        
        if (headerEndIndex !== -1) {
          const headers = part.subarray(0, headerEndIndex).toString();
          
          if (headers.includes('name="avatar"')) {
            const fileData = part.subarray(headerEndIndex + 4);
            const filenameMatch = headers.match(/filename="([^"]+)"/);
            const mimeTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);
            
            req.file = {
              originalname: filenameMatch ? filenameMatch[1] : 'avatar',
              mimetype: mimeTypeMatch ? mimeTypeMatch[1].trim() : 'application/octet-stream',
              buffer: fileData,
              size: fileData.length
            };
            return next();
          }
        }
        index = nextIndex;
      }
      
      return res.status(400).json({ success: false, message: 'No avatar field found in form data' });
    } catch (error) {
      console.error('Multipart parse error:', error);
      return res.status(500).json({ success: false, message: 'Failed to parse form data' });
    }
  });

  req.on('error', (err) => {
    if (!res.headersSent) next(err);
  });
};