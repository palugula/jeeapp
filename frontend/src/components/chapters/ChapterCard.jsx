import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Video, FileText, BookOpen } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProgressBar from '../common/ProgressBar.jsx';
import { EisenhowerBadge } from '../common/Badge.jsx';

export default function ChapterCard({ chapter, index }) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: chapter._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const { stats = {} } = chapter;
  const progress = stats.lectureProgress ?? stats.progress ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: '#161B22', borderColor: '#262C36' }}
      className="rounded-xl border flex items-center gap-3 p-4 hover:border-primary/30 transition-colors"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-text-muted hover:text-text-card cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </button>

      {/* Order number */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-text-accent flex-shrink-0"
        style={{ background: '#262C36' }}>
        {index + 1}
      </div>

      {/* Info — click to navigate */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/chapter/${chapter._id}`)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-text-card truncate">{chapter.name}</h3>
          {chapter.eisenhowerLabel && <EisenhowerBadge value={chapter.eisenhowerLabel} />}
          {chapter.confidence && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              chapter.confidence === 'high' ? 'bg-green-900 text-green-400' :
              chapter.confidence === 'moderate' ? 'bg-yellow-900 text-yellow-400' :
              'bg-red-900 text-red-400'
            }`}>
              {chapter.confidence}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1.5">
          <ProgressBar value={progress} height={4} className="w-28" />
          <span className="text-xs text-text-muted">{progress}%</span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Video size={10} /> {stats.totalLectures ?? stats.lectureCount ?? 0}
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <FileText size={10} /> {stats.totalNotes ?? stats.notesCount ?? 0}
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <BookOpen size={10} /> {stats.totalWorksheets ?? stats.worksheetCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
