import express from 'express';
import Chapter from '../models/Chapter.js';
import ContentItem from '../models/ContentItem.js';
import { extractYoutubeVideoId, getYoutubeVideoInfo } from '../services/youtubeService.js';

const router = express.Router();

// GET /api/chapters/:id
router.get('/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const items = await ContentItem.find({ chapterId: chapter._id });
    const lectures = items.filter(i => i.type === 'lecture');
    const notes = items.filter(i => i.type === 'notes');
    const worksheets = items.filter(i => i.type === 'worksheet');
    const completed = items.filter(i => i.completed);

    const totalDuration = lectures.reduce((sum, i) => sum + (i.duration || 0), 0);
    const watchedDuration = lectures.reduce((sum, i) => sum + (i.currentTime || 0), 0);
    const progress = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;

    res.json({
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
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/chapters/:id
router.put('/:id', async (req, res) => {
  try {
    const allowed = [
      'eisenhowerLabel', 'referenceBook', 'referenceBookProgress',
      'coachingModuleDone', 'pyqsDone', 'confidence', 'notesPerfection', 'name', 'order'
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const chapter = await Chapter.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chapters/:subject/reorder
router.post('/:subject/reorder', async (req, res) => {
  try {
    const { subject } = req.params;
    const { items } = req.body; // [{id, order}]

    await Promise.all(items.map(({ id, order }) =>
      Chapter.findByIdAndUpdate(id, { order })
    ));

    res.json({ message: 'Chapters reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chapters/:id/items
router.get('/:id/items', async (req, res) => {
  try {
    const items = await ContentItem.find({ chapterId: req.params.id }).sort({ type: 1, order: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chapters/:id/items/youtube
router.post('/:id/items/youtube', async (req, res) => {
  try {
    const { url, name, type = 'lecture' } = req.body;
    if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

    const videoId = extractYoutubeVideoId(url);
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    // Get video info
    const videoInfo = await getYoutubeVideoInfo(videoId);

    // Get max order for this type
    const maxOrderItem = await ContentItem.findOne({ chapterId: req.params.id, type })
      .sort({ order: -1 });
    const order = maxOrderItem ? maxOrderItem.order + 1 : 0;

    const item = new ContentItem({
      chapterId: chapter._id,
      subject: chapter.subject,
      chapterName: chapter.name,
      type,
      itemType: 'youtube',
      name: name || videoInfo.title,
      youtubeUrl: url,
      youtubeVideoId: videoId,
      order,
      duration: videoInfo.duration || 0
    });
    await item.save();

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chapters/:id/items/reorder
router.post('/:id/items/reorder', async (req, res) => {
  try {
    const { items } = req.body; // [{id, order}]

    await Promise.all(items.map(({ id, order }) =>
      ContentItem.findByIdAndUpdate(id, { order })
    ));

    res.json({ message: 'Items reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
