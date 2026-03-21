import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploads
app.use('/uploads', express.static(uploadsPath));

// Import routes
import subjectsRouter from './routes/subjects.js';
import chaptersRouter from './routes/chapters.js';
import itemsRouter from './routes/items.js';
import analyticsRouter from './routes/analytics.js';
import weeklyPlanRouter from './routes/weeklyPlan.js';
import settingsRouter from './routes/settings.js';
import filesRouter from './routes/files.js';
import videoNotesRouter from './routes/videoNotes.js';

// Routes
app.use('/api/subjects', subjectsRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/items', itemsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/weekly-plan', weeklyPlanRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/files', filesRouter);
app.use('/api/notes', videoNotesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Auto-scan on startup
    const { scanAllSubjects } = await import('./services/fileScanner.js');
    try {
      await scanAllSubjects();
      console.log('Initial file system scan completed');
    } catch (scanErr) {
      console.warn('File system scan warning:', scanErr.message);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
