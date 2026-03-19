import express from 'express';
import ContentItem from '../models/ContentItem.js';
import StudySession from '../models/StudySession.js';

const router = express.Router();

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function recordStudySession(item, durationMinutes = 1) {
  const today = getTodayDate();
  try {
    await StudySession.findOneAndUpdate(
      { date: today, subject: item.subject, itemId: item._id },
      {
        $inc: { duration: durationMinutes },
        $set: { chapterId: item.chapterId }
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('Failed to record study session:', err.message);
  }
}

// PUT /api/items/:id/progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { currentTime, duration } = req.body;
    const item = await ContentItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const prevTime = item.currentTime || 0;
    const newTime = currentTime || 0;
    const timeDiff = Math.max(0, newTime - prevTime);
    const minutesWatched = Math.floor(timeDiff / 60);

    const update = {
      currentTime: newTime,
      lastAccessedAt: new Date()
    };

    if (duration && duration > 0) {
      update.duration = duration;
    }

    // Auto-complete if watched 90%+
    const effectiveDuration = duration || item.duration;
    if (effectiveDuration > 0 && newTime >= effectiveDuration * 0.9) {
      update.completed = true;
      if (!item.completed) {
        update.completedAt = new Date();
      }
    }

    await ContentItem.findByIdAndUpdate(req.params.id, update);

    // Record study session
    if (minutesWatched > 0) {
      await recordStudySession(item, minutesWatched);
    }

    res.json({ success: true, currentTime: newTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/items/:id/complete
router.put('/:id/complete', async (req, res) => {
  try {
    const { completed } = req.body;
    const item = await ContentItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const update = {
      completed,
      lastAccessedAt: new Date()
    };

    if (completed && !item.completed) {
      update.completedAt = new Date();
    } else if (!completed) {
      update.completedAt = null;
    }

    const updated = await ContentItem.findByIdAndUpdate(req.params.id, update, { new: true });

    // Record study session when completing
    if (completed) {
      await recordStudySession(item, 5);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/items/:id/access
router.put('/:id/access', async (req, res) => {
  try {
    const item = await ContentItem.findByIdAndUpdate(
      req.params.id,
      { lastAccessedAt: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await recordStudySession(item, 1);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await ContentItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
