import mongoose from 'mongoose';

const planItemSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentItem',
    default: null
  },
  subject: String,
  chapterName: String,
  itemName: String,
  estimatedMinutes: {
    type: Number,
    default: 60
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const dayPlanSchema = new mongoose.Schema({
  date: String, // YYYY-MM-DD
  items: [planItemSchema]
}, { _id: false });

const weeklyPlanSchema = new mongoose.Schema({
  weekStart: {
    type: String, // YYYY-MM-DD (Monday)
    required: true,
    unique: true
  },
  plans: [dayPlanSchema]
}, {
  timestamps: true
});

export default mongoose.model('WeeklyPlan', weeklyPlanSchema);
