import express from 'express';
import VideoNote from '../models/VideoNote.js';
import ContentItem from '../models/ContentItem.js';

const router = express.Router();

// GET /api/notes/item/:itemId  — all notes for one item (sorted by timestamp)
router.get('/item/:itemId', async (req, res) => {
  try {
    const notes = await VideoNote.find({ itemId: req.params.itemId })
      .sort({ timestamp: 1, createdAt: 1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes/item/:itemId  — create note
router.post('/item/:itemId', async (req, res) => {
  try {
    const { timestamp, content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const item = await ContentItem.findById(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const note = new VideoNote({
      itemId: item._id,
      chapterId: item.chapterId,
      subject: item.subject,
      chapterName: item.chapterName,
      itemName: item.name,
      timestamp: (timestamp !== undefined && timestamp !== null && timestamp !== '') ? Number(timestamp) : null,
      content: content.trim()
    });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notes/:id  — update note content
router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });
    const note = await VideoNote.findByIdAndUpdate(
      req.params.id,
      { content: content.trim() },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  try {
    await VideoNote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper — build item map for a set of itemIds
async function buildItemMap(itemIds) {
  const items = await ContentItem.find({ _id: { $in: itemIds } });
  return Object.fromEntries(items.map(i => [i._id.toString(), i.toObject()]));
}

// GET /api/notes/chapter/:chapterId  — notes grouped by item, includes full item object
router.get('/chapter/:chapterId', async (req, res) => {
  try {
    const notes = await VideoNote.find({ chapterId: req.params.chapterId })
      .sort({ itemId: 1, timestamp: 1, createdAt: 1 });

    const itemIds = [...new Set(notes.map(n => n.itemId.toString()))];
    const itemMap = await buildItemMap(itemIds);

    const groups = {};
    for (const note of notes) {
      const ik = note.itemId.toString();
      if (!groups[ik]) {
        groups[ik] = {
          itemId: note.itemId,
          itemName: note.itemName || 'Unknown',
          item: itemMap[ik] || null,
          notes: []
        };
      }
      groups[ik].notes.push(note);
    }

    res.json(Object.values(groups));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/subject/:subject  — notes grouped by chapter > item, includes full item object
router.get('/subject/:subject', async (req, res) => {
  try {
    const notes = await VideoNote.find({ subject: req.params.subject })
      .sort({ chapterId: 1, itemId: 1, timestamp: 1, createdAt: 1 });

    const itemIds = [...new Set(notes.map(n => n.itemId.toString()))];
    const itemMap = await buildItemMap(itemIds);

    const chapterMap = {};
    for (const note of notes) {
      const ck = note.chapterId?.toString() || 'no-chapter';
      if (!chapterMap[ck]) {
        chapterMap[ck] = {
          chapterId: note.chapterId,
          chapterName: note.chapterName || 'Unknown Chapter',
          items: {}
        };
      }
      const ik = note.itemId.toString();
      if (!chapterMap[ck].items[ik]) {
        chapterMap[ck].items[ik] = {
          itemId: note.itemId,
          itemName: note.itemName || 'Unknown Item',
          item: itemMap[ik] || null,
          notes: []
        };
      }
      chapterMap[ck].items[ik].notes.push(note);
    }

    const result = Object.values(chapterMap).map(ch => ({
      ...ch,
      items: Object.values(ch.items)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
