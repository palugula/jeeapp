import express from 'express';
import WeeklyPlan from '../models/WeeklyPlan.js';
import ContentItem from '../models/ContentItem.js';
import Chapter from '../models/Chapter.js';
import { startOfWeek, format, parseISO, addDays } from 'date-fns';

const router = express.Router();

function getWeekStart(date = new Date()) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

function buildEmptyWeek(weekStart) {
  const plans = [];
  for (let i = 0; i < 7; i++) {
    const date = format(addDays(parseISO(weekStart), i), 'yyyy-MM-dd');
    plans.push({ date, items: [] });
  }
  return plans;
}

// GET /api/weekly-plan - current week
router.get('/', async (req, res) => {
  try {
    const weekStart = getWeekStart();
    let plan = await WeeklyPlan.findOne({ weekStart });

    if (!plan) {
      plan = { weekStart, plans: buildEmptyWeek(weekStart) };
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/weekly-plan/:weekStart
router.get('/:weekStart', async (req, res) => {
  try {
    const { weekStart } = req.params;
    let plan = await WeeklyPlan.findOne({ weekStart });

    if (!plan) {
      plan = { weekStart, plans: buildEmptyWeek(weekStart) };
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/weekly-plan/:weekStart
router.put('/:weekStart', async (req, res) => {
  try {
    const { weekStart } = req.params;
    const { plans } = req.body;

    const plan = await WeeklyPlan.findOneAndUpdate(
      { weekStart },
      { weekStart, plans },
      { upsert: true, new: true }
    );

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/weekly-plan/estimate
router.post('/estimate', async (req, res) => {
  try {
    const { chapterId, itemId } = req.body;

    if (itemId) {
      const item = await ContentItem.findById(itemId);
      if (!item) return res.status(404).json({ error: 'Item not found' });

      let minutes = 60;
      if (item.itemType === 'local_video' || item.itemType === 'youtube') {
        const remaining = (item.duration || 3600) - (item.currentTime || 0);
        minutes = Math.max(5, Math.ceil(remaining / 60));
      } else {
        minutes = 30;
      }

      res.json({ estimatedMinutes: minutes });
    } else if (chapterId) {
      const items = await ContentItem.find({ chapterId, completed: false });
      let totalMinutes = 0;

      for (const item of items) {
        if (item.itemType === 'local_video' || item.itemType === 'youtube') {
          const remaining = (item.duration || 3600) - (item.currentTime || 0);
          totalMinutes += Math.max(0, Math.ceil(remaining / 60));
        } else {
          totalMinutes += 30;
        }
      }

      res.json({ estimatedMinutes: totalMinutes || 60 });
    } else {
      res.status(400).json({ error: 'chapterId or itemId required' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
