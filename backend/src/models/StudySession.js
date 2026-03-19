import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  duration: {
    type: Number, // minutes
    default: 0
  },
  subject: {
    type: String,
    enum: ['Maths', 'Physics', 'Chemistry'],
    required: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentItem',
    default: null
  }
}, {
  timestamps: true
});

studySessionSchema.index({ date: 1 });
studySessionSchema.index({ date: 1, subject: 1 });

export default mongoose.model('StudySession', studySessionSchema);
