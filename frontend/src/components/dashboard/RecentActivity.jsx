import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, FileText, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecentActivity({ items = [] }) {
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        No recent activity. Start studying!
      </div>
    );
  }

  const getIcon = (item) => {
    if (item.itemType === 'local_video' || item.itemType === 'youtube') {
      return <Play size={14} />;
    }
    return <FileText size={14} />;
  };

  const getSubjectColor = (subject) => {
    const colors = { Maths: '#6366F1', Physics: '#10B981', Chemistry: '#F59E0B' };
    return colors[subject] || '#6366F1';
  };

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item._id}
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent"
          style={{ background: '#1E293B' }}
          onClick={() => navigate(`/chapter/${item.chapterId}`)}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: getSubjectColor(item.subject) + '22', color: getSubjectColor(item.subject) }}
          >
            {getIcon(item)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-card truncate">{item.name}</p>
            <p className="text-xs text-text-muted">{item.subject} • {item.chapterName}</p>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {item.completed ? (
              <CheckCircle size={14} className="text-green-400" />
            ) : (
              item.currentTime > 0 && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock size={10} />
                  {formatDuration(item.currentTime)}
                </span>
              )
            )}
            {item.lastAccessedAt && (
              <span className="text-xs text-text-muted">
                {formatDistanceToNow(new Date(item.lastAccessedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
