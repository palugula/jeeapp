import mongoose from 'mongoose';

const videoNoteSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentItem',
    required: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  },
  subject: { type: String },
  chapterName: { type: String },
  itemName: { type: String },
  // null = no timestamp (manual note without time)
  timestamp: { type: Number, default: null },
  content: { type: String, required: true, trim: true }
}, { timestamps: true });

videoNoteSchema.index({ itemId: 1, timestamp: 1 });
videoNoteSchema.index({ subject: 1 });

export default mongoose.model('VideoNote', videoNoteSchema);
