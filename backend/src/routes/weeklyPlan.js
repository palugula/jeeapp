import express from 'express';
import WeeklyPlan from '../models/WeeklyPlan.js';
import { startOfWeek, format } from 'date-fns';

const router = express.Router();

function getWeekStart(date = new Date()) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

// GET /api/weekly-plan?week=YYYY-MM-DD  (defaults to current week)
router.get('/', async (req, res) => {
  try {
    const weekStart = req.query.week || getWeekStart();
    let plan = await WeeklyPlan.findOne({ weekStart });
    if (!plan) {
      plan = { weekStart, tasks: [] };
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
      plan = { weekStart, tasks: [] };
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/weekly-plan/:weekStart/tasks  — add a task
router.post('/:weekStart/tasks', async (req, res) => {
  try {
    const { weekStart } = req.params;
    const { chapterId, subject, chapterName, taskTitle, startDate, endDate, startTime, endTime } = req.body;

    if (!chapterId) return res.status(400).json({ error: 'chapterId is required' });
    if (!startDate) return res.status(400).json({ error: 'startDate is required' });
    if (!endDate)   return res.status(400).json({ error: 'endDate is required' });

    const task = { chapterId, subject, chapterName, taskTitle: taskTitle || '', startDate, endDate, startTime: startTime || '', endTime: endTime || '', completed: false };

    const plan = await WeeklyPlan.findOneAndUpdate(
      { weekStart },
      { $push: { tasks: task } },
      { upsert: true, new: true }
    );

    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/weekly-plan/:weekStart/tasks/:taskId  — update task fields
router.patch('/:weekStart/tasks/:taskId', async (req, res) => {
  try {
    const { weekStart, taskId } = req.params;
    const allowed = ['taskTitle', 'startDate', 'endDate', 'startTime', 'endTime', 'completed'];
    const setFields = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) setFields[`tasks.$.${key}`] = req.body[key];
    }

    const plan = await WeeklyPlan.findOneAndUpdate(
      { weekStart, 'tasks._id': taskId },
      { $set: setFields },
      { new: true }
    );
    if (!plan) return res.status(404).json({ error: 'Task not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/weekly-plan/:weekStart/tasks/:taskId
router.delete('/:weekStart/tasks/:taskId', async (req, res) => {
  try {
    const { weekStart, taskId } = req.params;
    const plan = await WeeklyPlan.findOneAndUpdate(
      { weekStart },
      { $pull: { tasks: { _id: taskId } } },
      { new: true }
    );
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
