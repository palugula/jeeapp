import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ExternalLink, CheckCircle, Circle, ArrowUp, ArrowDown, Youtube, FileText, File } from 'lucide-react';
import ProgressBar from '../common/ProgressBar.jsx';
import { toggleComplete } from '../../lib/api.js';
import VideoPlayer from '../player/VideoPlayer.jsx';

function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getProgress(item) {
  if (!item.duration || item.itemType === 'pdf' || item.itemType === 'document') return item.completed ? 100 : 0;
  if (item.completed) return 100;
  return item.duration > 0 ? Math.min(100, Math.round((item.currentTime / item.duration) * 100)) : 0;
}

function getIcon(item) {
  if (item.itemType === 'youtube') return <Youtube size={14} className="text-red-500" />;
  if (item.itemType === 'local_video') return <Play size={14} className="text-primary" />;
  if (item.itemType === 'pdf') return <FileText size={14} className="text-amber-400" />;
  return <File size={14} className="text-blue-400" />;
}

export default function ContentItemRow({ item, index, total, onMoveUp, onMoveDown, onUpdate }) {
  const [completed, setCompleted] = useState(item.completed);
  const [toggling, setToggling] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try {
      await toggleComplete(item._id, !completed);
      setCompleted(!completed);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    if (item.itemType === 'local_video' || item.itemType === 'youtube') {
      setPlayerOpen(true);
    } else if (item.itemType === 'pdf' || item.itemType === 'document') {
      const url = item.filePath ? `/api/files/document/${item.filePath}` : '#';
      window.open(url, '_blank');
    }
  };

  const progress = getProgress(item);

  return (
    <>
      <div
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors group"
        style={{ background: completed ? 'rgba(16, 185, 129, 0.05)' : undefined }}
      >
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onMoveUp()} disabled={index === 0} className="p-0.5 rounded hover:bg-muted text-text-muted disabled:opacity-20">
            <ArrowUp size={10} />
          </button>
          <button onClick={() => onMoveDown()} disabled={index === total - 1} className="p-0.5 rounded hover:bg-muted text-text-muted disabled:opacity-20">
            <ArrowDown size={10} />
          </button>
        </div>

        {/* Icon */}
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          {getIcon(item)}
        </div>

        {/* Name & progress */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${completed ? 'line-through text-text-muted' : 'text-text-card'}`}>
            {item.name}
          </p>
          {(item.itemType === 'local_video' || item.itemType === 'youtube') && item.duration > 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <ProgressBar value={progress} height={3} className="w-24" />
              <span className="text-xs text-text-muted">{formatDuration(item.currentTime)}/{formatDuration(item.duration)}</span>
            </div>
          )}
        </div>

        {/* Duration */}
        {item.duration > 0 && (
          <span className="text-xs text-text-muted flex-shrink-0">{formatDuration(item.duration)}</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleOpen}
            className="p-1.5 rounded-lg hover:bg-muted text-text-muted hover:text-text-card transition-colors"
          >
            {item.itemType === 'local_video' || item.itemType === 'youtube' ? (
              <Play size={14} />
            ) : (
              <ExternalLink size={14} />
            )}
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`p-1.5 rounded-lg transition-colors ${completed ? 'text-green-400' : 'text-text-muted hover:text-green-400'}`}
          >
            {completed ? <CheckCircle size={14} /> : <Circle size={14} />}
          </button>
        </div>
      </div>

      {playerOpen && (
        <VideoPlayer
          item={item}
          onClose={() => { setPlayerOpen(false); onUpdate(); }}
          onComplete={() => { setCompleted(true); onUpdate(); }}
        />
      )}
    </>
  );
}
