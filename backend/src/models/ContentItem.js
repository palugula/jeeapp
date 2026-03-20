import mongoose from 'mongoose';

const contentItemSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['Maths', 'Physics', 'Chemistry']
  },
  chapterName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['lecture', 'notes', 'worksheet']
  },
  itemType: {
    type: String,
    required: true,
    enum: ['local_video', 'youtube', 'pdf', 'document', 'manual']
  },
  hasVideo: {
    type: Boolean,
    default: true
  },
  name: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    default: null
  },
  youtubeUrl: {
    type: String,
    default: null
  },
  youtubeVideoId: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  currentTime: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastAccessedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

contentItemSchema.index({ chapterId: 1, type: 1, order: 1 });
contentItemSchema.index({ subject: 1 });
contentItemSchema.index({ filePath: 1 }, { sparse: true });

export default mongoose.model('ContentItem', contentItemSchema);
