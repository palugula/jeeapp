import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const STUDY_CONTENT_PATH = process.env.STUDY_CONTENT_PATH || path.join(__dirname, '../../../study-content');

// GET /api/files/video/:filePath* - stream video file
router.get('/video/*', (req, res) => {
  const relPath = req.params[0];
  const filePath = path.join(STUDY_CONTENT_PATH, relPath);

  // Security: ensure path is within study-content
  if (!filePath.startsWith(STUDY_CONTENT_PATH)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': getVideoMimeType(filePath)
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': getVideoMimeType(filePath),
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// GET /api/files/document/:filePath* - serve document
router.get('/document/*', (req, res) => {
  const relPath = req.params[0];
  const filePath = path.join(STUDY_CONTENT_PATH, relPath);

  // Security: ensure path is within study-content
  if (!filePath.startsWith(STUDY_CONTENT_PATH)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = getDocumentMimeType(ext);

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);

  fs.createReadStream(filePath).pipe(res);
});

function getVideoMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime'
  };
  return mimeTypes[ext] || 'video/mp4';
}

function getDocumentMimeType(ext) {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export default router;
