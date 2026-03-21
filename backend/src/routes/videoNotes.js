import express from 'express';
import VideoNote from '../models/VideoNote.js';
import ContentItem from '../models/ContentItem.js';

const router = express.Router();

// GET /api/notes/item/:itemId  — all notes for one item
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

// GET /api/notes/subject/:subject  — all notes grouped by chapter > item
router.get('/subject/:subject', async (req, res) => {
  try {
    const notes = await VideoNote.find({ subject: req.params.subject })
      .sort({ createdAt: -1 });

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
