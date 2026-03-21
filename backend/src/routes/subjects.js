import express from 'express';
import Chapter from '../models/Chapter.js';
import ContentItem from '../models/ContentItem.js';
import { scanSubject } from '../services/fileScanner.js';

const router = express.Router();

const SUBJECTS = ['Maths', 'Physics', 'Chemistry'];

// GET /api/subjects - list all subjects with lecture-only progress
router.get('/', async (req, res) => {
  try {
    const subjects = await Promise.all(SUBJECTS.map(async (subject) => {
      const chapters = await Chapter.find({ subject }).sort({ order: 1 });
      const chapterIds = chapters.map(c => c._id);

      const lectureCount = await ContentItem.countDocuments({
        chapterId: { $in: chapterIds },
        type: 'lecture'
      });
      const completedLectures = await ContentItem.countDocuments({
        chapterId: { $in: chapterIds },
        type: 'lecture',
        completed: true
      });

      const progress = lectureCount > 0
        ? Math.round((completedLectures / lectureCount) * 100)
        : 0;

      return {
        name: subject,
        chapterCount: chapters.length,
        lectureCount,
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
      const lectures   = items.filter(i => i.type === 'lecture');
      const notes      = items.filter(i => i.type === 'notes');
      const worksheets = items.filter(i => i.type === 'worksheet');

      const completedLectures   = lectures.filter(i => i.completed).length;
      const completedNotes      = notes.filter(i => i.completed).length;
      const completedWorksheets = worksheets.filter(i => i.completed).length;

      const lectureProgress = lectures.length > 0
        ? Math.round((completedLectures / lectures.length) * 100)
        : 0;

      const totalDuration   = lectures.reduce((s, i) => s + (i.duration || 0), 0);
      const watchedDuration = lectures.reduce((s, i) => s + (i.currentTime || 0), 0);

      return {
        ...chapter.toObject(),
        stats: {
          totalLectures: lectures.length,
          completedLectures,
          lectureProgress,
          totalNotes: notes.length,
          completedNotes,
          totalWorksheets: worksheets.length,
          completedWorksheets,
          totalDuration,
          watchedDuration,
          progress: lectureProgress
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
