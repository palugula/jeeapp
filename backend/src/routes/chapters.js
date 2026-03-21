import express from 'express';
import Chapter from '../models/Chapter.js';
import ContentItem from '../models/ContentItem.js';
import { extractYoutubeVideoId, getYoutubeVideoInfo } from '../services/youtubeService.js';

const router = express.Router();

function buildStats(items) {
  const lectures   = items.filter(i => i.type === 'lecture');
  const notes      = items.filter(i => i.type === 'notes');
  const worksheets = items.filter(i => i.type === 'worksheet');

  const completedLectures   = lectures.filter(i => i.completed).length;
  const completedNotes      = notes.filter(i => i.completed).length;
  const completedWorksheets = worksheets.filter(i => i.completed).length;

  // Progress is based on lectures ONLY (requirement 5)
  const lectureProgress = lectures.length > 0
    ? Math.round((completedLectures / lectures.length) * 100)
    : 0;

  const totalDuration   = lectures.reduce((s, i) => s + (i.duration || 0), 0);
  const watchedDuration = lectures.reduce((s, i) => s + (i.currentTime || 0), 0);

  return {
    totalLectures: lectures.length,
    completedLectures,
    lectureProgress,
    totalNotes: notes.length,
    completedNotes,
    totalWorksheets: worksheets.length,
    completedWorksheets,
    totalDuration,
    watchedDuration,
    // keep 'progress' alias so frontend progress bars work transparently
    progress: lectureProgress
  };
}

// GET /api/chapters/:id
router.get('/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const items = await ContentItem.find({ chapterId: chapter._id });
    res.json({ ...chapter.toObject(), stats: buildStats(items) });
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
    const { items } = req.body;
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
    const items = await ContentItem.find({ chapterId: req.params.id })
      .sort({ type: 1, order: 1 });
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

    const videoInfo = await getYoutubeVideoInfo(videoId);
    const maxOrder  = await ContentItem.findOne({ chapterId: req.params.id, type }).sort({ order: -1 });
    const order     = maxOrder ? maxOrder.order + 1 : 0;

    const item = new ContentItem({
      chapterId: chapter._id,
      subject: chapter.subject,
      chapterName: chapter.name,
      type,
      itemType: 'youtube',
      hasVideo: true,
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

// POST /api/chapters/:id/items/manual  — lecture without a video file
router.post('/:id/items/manual', async (req, res) => {
  try {
    const { name, type = 'lecture' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const maxOrder = await ContentItem.findOne({ chapterId: req.params.id, type }).sort({ order: -1 });
    const order    = maxOrder ? maxOrder.order + 1 : 0;

    const item = new ContentItem({
      chapterId: chapter._id,
      subject: chapter.subject,
      chapterName: chapter.name,
      type,
      itemType: 'manual',
      hasVideo: false,
      name: name.trim(),
      order
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
    const { items } = req.body;
    await Promise.all(items.map(({ id, order }) =>
      ContentItem.findByIdAndUpdate(id, { order })
    ));
    res.json({ message: 'Items reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
