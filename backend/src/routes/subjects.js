import express from 'express';
import Chapter from '../models/Chapter.js';
import ContentItem from '../models/ContentItem.js';
import { scanSubject } from '../services/fileScanner.js';

const router = express.Router();

const SUBJECTS = ['Maths', 'Physics', 'Chemistry'];

// GET /api/subjects - list all subjects with stats
router.get('/', async (req, res) => {
  try {
    const subjects = await Promise.all(SUBJECTS.map(async (subject) => {
      const chapters = await Chapter.find({ subject }).sort({ order: 1 });
      const chapterIds = chapters.map(c => c._id);

      const totalItems = await ContentItem.countDocuments({ chapterId: { $in: chapterIds } });
      const completedItems = await ContentItem.countDocuments({
        chapterId: { $in: chapterIds },
        completed: true
      });

      const lectureItems = await ContentItem.countDocuments({
        chapterId: { $in: chapterIds },
        type: 'lecture'
      });
      const completedLectures = await ContentItem.countDocuments({
        chapterId: { $in: chapterIds },
        type: 'lecture',
        completed: true
      });

      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        name: subject,
        chapterCount: chapters.length,
        totalItems,
        completedItems,
        lectureCount: lectureItems,
        completedLectures,
        progress
      };
    }));

    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects/:subject/chapters
router.get('/:subject/chapters', async (req, res) => {
  try {
    const { subject } = req.params;
    if (!SUBJECTS.includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject' });
    }

    const chapters = await Chapter.find({ subject }).sort({ order: 1 });

    const chaptersWithStats = await Promise.all(chapters.map(async (chapter) => {
      const items = await ContentItem.find({ chapterId: chapter._id });
      const lectures = items.filter(i => i.type === 'lecture');
      const notes = items.filter(i => i.type === 'notes');
      const worksheets = items.filter(i => i.type === 'worksheet');
      const completed = items.filter(i => i.completed);

      const totalDuration = lectures.reduce((sum, i) => sum + (i.duration || 0), 0);
      const watchedDuration = lectures.reduce((sum, i) => sum + (i.currentTime || 0), 0);
      const progress = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;

      return {
        ...chapter.toObject(),
        stats: {
          totalItems: items.length,
          lectureCount: lectures.length,
          notesCount: notes.length,
          worksheetCount: worksheets.length,
          completedCount: completed.length,
          progress,
          totalDuration,
          watchedDuration
        }
      };
    }));

    res.json(chaptersWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subjects/:subject/scan
router.post('/:subject/scan', async (req, res) => {
  try {
    const { subject } = req.params;
    if (!SUBJECTS.includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject' });
    }

    await scanSubject(subject);
    res.json({ message: `Scan completed for ${subject}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
