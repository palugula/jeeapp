import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  subject: String,
  chapterName: String,
  taskTitle: { type: String, default: '' },
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate:   { type: String, required: true }, // YYYY-MM-DD (>= startDate)
  startTime: { type: String, default: '' },    // HH:MM (24h)
  endTime:   { type: String, default: '' },    // HH:MM (24h)
  completed: { type: Boolean, default: false }
}, { _id: true });

const weeklyPlanSchema = new mongoose.Schema({
  weekStart: {
    type: String, // YYYY-MM-DD (Monday)
    required: true,
    unique: true
  },
  tasks: [taskSchema]
}, { timestamps: true });

export default mongoose.model('WeeklyPlan', weeklyPlanSchema);
