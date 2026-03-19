import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Settings from '../models/Settings.js';
import { scanAllSubjects } from '../services/fileScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${req.uploadType || 'upload'}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.find({});
    const result = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/:key
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/profile-pic
router.post('/profile-pic', (req, res) => {
  req.uploadType = 'profile';
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const url = `/uploads/${req.file.filename}`;
    await Settings.findOneAndUpdate(
      { key: 'profilePicture' },
      { key: 'profilePicture', value: url },
      { upsert: true }
    );

    res.json({ url });
  });
});

// POST /api/settings/banner
router.post('/banner', (req, res) => {
  req.uploadType = 'banner';
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const url = `/uploads/${req.file.filename}`;
    await Settings.findOneAndUpdate(
      { key: 'bannerImage' },
      { key: 'bannerImage', value: url },
      { upsert: true }
    );

    res.json({ url });
  });
});

// POST /api/settings/rescan
router.post('/rescan', async (req, res) => {
  try {
    await scanAllSubjects();
    res.json({ message: 'Full rescan completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
