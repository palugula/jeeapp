import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: ['Maths', 'Physics', 'Chemistry']
  },
  name: {
    type: String,
    required: true
  },
  folderPath: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  eisenhowerLabel: {
    type: String,
    enum: ['hard_high_weight', 'easy_high_weight', 'hard_low_weight', 'easy_low_weight', null],
    default: null
  },
  referenceBook: {
    type: String,
    default: ''
  },
  referenceBookProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  coachingModuleDone: {
    type: Boolean,
    default: false
  },
  pyqsDone: {
    type: Number,
    default: 0
  },
  confidence: {
    type: String,
    enum: ['high', 'moderate', 'low', null],
    default: null
  },
  notesPerfection: {
    type: String,
    enum: ['completed', 'few_pendings', 'many_pendings', 'not_started', null],
    default: null
  }
}, {
  timestamps: true
});

chapterSchema.index({ subject: 1, order: 1 });
chapterSchema.index({ folderPath: 1 }, { unique: true });

export default mongoose.model('Chapter', chapterSchema);
