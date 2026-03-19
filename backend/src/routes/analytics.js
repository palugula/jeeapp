import express from 'express';
import Chapter from '../models/Chapter.js';
import ContentItem from '../models/ContentItem.js';
import StudySession from '../models/StudySession.js';
import { subDays, format, parseISO } from 'date-fns';

const router = express.Router();

const SUBJECTS = ['Maths', 'Physics', 'Chemistry'];

// GET /api/analytics
router.get('/', async (req, res) => {
  try {
    const allItems = await ContentItem.find({});
    const allSessions = await StudySession.find({});

    const totalMinutes = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    const videosCompleted = allItems.filter(i => i.completed && (i.itemType === 'local_video' || i.itemType === 'youtube')).length;
    const pdfsCompleted = allItems.filter(i => i.completed && (i.itemType === 'pdf' || i.itemType === 'document')).length;

    const subjectStats = await Promise.all(SUBJECTS.map(async (subject) => {
      const chapters = await Chapter.find({ subject });
      const chapterIds = chapters.map(c => c._id);
      const items = await ContentItem.find({ chapterId: { $in: chapterIds } });
      const completed = items.filter(i => i.completed);
      const sessions = allSessions.filter(s => s.subject === subject);
      const subjectMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

      return {
        subject,
        chapterCount: chapters.length,
        totalItems: items.length,
        completedItems: completed.length,
        progress: items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0,
        studyHours: Math.round(subjectMinutes / 60 * 10) / 10
      };
    }));

    const chapters = await Chapter.find({}).sort({ subject: 1, order: 1 });
    const chapterStats = await Promise.all(chapters.map(async (chapter) => {
      const items = await ContentItem.find({ chapterId: chapter._id });
      const completed = items.filter(i => i.completed);
      return {
        _id: chapter._id,
        name: chapter.name,
        subject: chapter.subject,
        totalItems: items.length,
        completedItems: completed.length,
        progress: items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0,
        confidence: chapter.confidence,
        eisenhowerLabel: chapter.eisenhowerLabel
      };
    }));

    res.json({
      overview: {
        totalHours,
        videosCompleted,
        pdfsCompleted,
        totalItems: allItems.length,
        completedItems: allItems.filter(i => i.completed).length
      },
      subjectStats,
      chapterStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/heatmap - last 12 weeks (84 days)
router.get('/heatmap', async (req, res) => {
  try {
    const today = new Date();
    const startDate = subDays(today, 83);
    const startDateStr = format(startDate, 'yyyy-MM-dd');

    const sessions = await StudySession.find({
      date: { $gte: startDateStr }
    });

    // Group by date
    const dateMap = {};
    for (let i = 0; i < 84; i++) {
      const d = format(subDays(today, 83 - i), 'yyyy-MM-dd');
      dateMap[d] = 0;
    }

    for (const session of sessions) {
      if (dateMap[session.date] !== undefined) {
        dateMap[session.date] += session.duration || 0;
      }
    }

    const heatmapData = Object.entries(dateMap).map(([date, minutes]) => ({
      date,
      minutes,
      level: minutes === 0 ? 0 : minutes <= 30 ? 1 : minutes <= 60 ? 2 : minutes <= 120 ? 3 : 4
    }));

    res.json(heatmapData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/recent - last 10 accessed items
router.get('/recent', async (req, res) => {
  try {
    const items = await ContentItem.find({
      lastAccessedAt: { $ne: null }
    })
      .sort({ lastAccessedAt: -1 })
      .limit(10);

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
