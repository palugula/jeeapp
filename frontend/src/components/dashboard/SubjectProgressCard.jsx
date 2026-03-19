import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, Play } from 'lucide-react';
import ProgressBar from '../common/ProgressBar.jsx';

const SUBJECT_CONFIG = {
  Maths: { color: '#6366F1', gradient: 'from-indigo-600 to-purple-600', emoji: '📐' },
  Physics: { color: '#10B981', gradient: 'from-emerald-600 to-teal-600', emoji: '⚛️' },
  Chemistry: { color: '#F59E0B', gradient: 'from-amber-600 to-orange-600', emoji: '🧪' }
};

export default function SubjectProgressCard({ subject }) {
  const navigate = useNavigate();
  const config = SUBJECT_CONFIG[subject.name] || SUBJECT_CONFIG.Maths;

  return (
    <div
      className="card-hover rounded-xl p-5 cursor-pointer border"
      style={{ background: '#161B22', borderColor: '#262C36' }}
      onClick={() => navigate(`/subject/${subject.name}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-2xl mb-1">{config.emoji}</div>
          <h3 className="font-bold text-text-card text-lg">{subject.name}</h3>
          <p className="text-text-muted text-sm">{subject.chapterCount} chapters</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="text-2xl font-bold"
            style={{ color: config.color }}
          >
            {subject.progress}%
          </span>
          <ChevronRight size={16} className="text-text-muted" />
        </div>
      </div>

      <ProgressBar value={subject.progress} color={config.color} height={8} />

      <div className="flex items-center justify-between mt-4 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Play size={12} />
          <span>{subject.completedLectures}/{subject.lectureCount} lectures</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen size={12} />
          <span>{subject.completedItems}/{subject.totalItems} items</span>
        </div>
      </div>
    </div>
  );
}
