import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, FileText, BookOpen, Play, CheckCircle, Circle, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';
import { getChapter, getChapterItems, toggleComplete, reorderItems } from '../lib/api.js';
import ChapterInfoForm from '../components/chapters/ChapterInfoForm.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';
import VideoPlayer from '../components/player/VideoPlayer.jsx';
import { EisenhowerBadge } from '../components/common/Badge.jsx';

const SUBJECT_COLORS = { Maths: '#6366F1', Physics: '#10B981', Chemistry: '#F59E0B' };

function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ItemCard({ item, index, total, onMoveUp, onMoveDown, onUpdate }) {
  const [completed, setCompleted] = useState(item.completed);
  const [toggling, setToggling] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);

  const handleToggle = async () => {
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

  const isVideo = item.itemType === 'local_video' || item.itemType === 'youtube';
  const progress = isVideo && item.duration > 0
    ? Math.min(100, Math.round(((item.currentTime || 0) / item.duration) * 100))
    : completed ? 100 : 0;

  return (
    <>
      <div
        className="flex items-center gap-3 p-4 rounded-xl border group transition-colors hover:border-primary/30"
        style={{ background: '#1E293B', borderColor: '#262C36' }}
      >
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onMoveUp} disabled={index === 0} className="p-0.5 text-text-muted disabled:opacity-30 hover:text-text-card">
            <ArrowUp size={12} />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-0.5 text-text-muted disabled:opacity-30 hover:text-text-card">
            <ArrowDown size={12} />
          </button>
        </div>

        {/* Icon */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: isVideo ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
          {isVideo ? (
            <Play size={16} style={{ color: item.itemType === 'youtube' ? '#EF4444' : '#6366F1' }} />
          ) : (
            <FileText size={16} style={{ color: '#F59E0B' }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${completed ? 'line-through text-text-muted' : 'text-text-card'}`}>
            {item.name}
          </p>
          {isVideo && (
            <div className="flex items-center gap-3 mt-1">
              <ProgressBar value={progress} height={3} className="w-32" />
              <span className="text-xs text-text-muted">
                {item.currentTime ? formatDuration(item.currentTime) : '0:00'}
                {item.duration ? ` / ${formatDuration(item.duration)}` : ''}
              </span>
            </div>
          )}
          {item.itemType === 'youtube' && (
            <span className="text-xs text-red-400 mt-0.5 block">YouTube</span>
          )}
        </div>

        {item.duration > 0 && (
          <span className="text-sm text-text-muted flex-shrink-0">{formatDuration(item.duration)}</span>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              if (isVideo) setPlayerOpen(true);
              else {
                const url = item.filePath ? `/api/files/document/${item.filePath}` : '#';
                window.open(url, '_blank');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-primary hover:opacity-90 transition-opacity"
          >
            {isVideo ? <Play size={12} /> : <ExternalLink size={12} />}
            {isVideo ? 'Play' : 'Open'}
          </button>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`p-1.5 rounded-lg transition-colors ${completed ? 'text-green-400' : 'text-text-muted hover:text-green-400'}`}
          >
            {completed ? <CheckCircle size={18} /> : <Circle size={18} />}
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

function ItemSection({ title, icon: Icon, items, onMoveUp, onMoveDown, onUpdate }) {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-bold text-text-card">
        <Icon size={18} className="text-primary" />
        {title} ({items.length})
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <ItemCard
            key={item._id}
            item={item}
            index={i}
            total={items.length}
            onMoveUp={() => onMoveUp(i)}
            onMoveDown={() => onMoveDown(i)}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChapterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [chapterData, itemsData] = await Promise.all([
        getChapter(id),
        getChapterItems(id)
      ]);
      setChapter(chapterData);
      setItems(itemsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleItemUpdate = async () => {
    const [chapterData, itemsData] = await Promise.all([
      getChapter(id),
      getChapterItems(id)
    ]);
    setChapter(chapterData);
    setItems(itemsData);
  };

  const moveItem = async (type, index, direction) => {
    const typeItems = items.filter(i => i.type === type).sort((a, b) => a.order - b.order);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= typeItems.length) return;

    const reordered = [...typeItems];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const updates = reordered.map((item, i) => ({ id: item._id, order: i }));
    await reorderItems(id, updates);
    await handleItemUpdate();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#161B22' }} />)}
      </div>
    );
  }

  if (!chapter) {
    return <div className="text-center text-text-muted py-12">Chapter not found.</div>;
  }

  const lectures = items.filter(i => i.type === 'lecture').sort((a, b) => a.order - b.order);
  const notes = items.filter(i => i.type === 'notes').sort((a, b) => a.order - b.order);
  const worksheets = items.filter(i => i.type === 'worksheet').sort((a, b) => a.order - b.order);

  const color = SUBJECT_COLORS[chapter.subject] || '#6366F1';
  const { stats = {} } = chapter;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/subject/${chapter.subject}`)}
        className="flex items-center gap-2 text-text-muted hover:text-text-card transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to {chapter.subject}
      </button>

      {/* Chapter Header */}
      <div className="rounded-xl p-6 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
              <span style={{ color }}>{chapter.subject}</span>
            </div>
            <h1 className="text-2xl font-bold text-text-card">{chapter.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {chapter.eisenhowerLabel && <EisenhowerBadge value={chapter.eisenhowerLabel} />}
              {chapter.confidence && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  chapter.confidence === 'high' ? 'bg-green-900 text-green-400' :
                  chapter.confidence === 'moderate' ? 'bg-yellow-900 text-yellow-400' :
                  'bg-red-900 text-red-400'
                }`}>
                  {chapter.confidence} confidence
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color }}>{stats.progress || 0}%</div>
            <p className="text-xs text-text-muted mt-1">{stats.completedCount}/{stats.totalItems} done</p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={stats.progress || 0} color={color} height={8} />
        </div>

        <div className="flex gap-6 mt-4 text-sm text-text-muted">
          <span className="flex items-center gap-1"><Video size={14} /> {stats.lectureCount || 0} lectures</span>
          <span className="flex items-center gap-1"><FileText size={14} /> {stats.notesCount || 0} notes</span>
          <span className="flex items-center gap-1"><BookOpen size={14} /> {stats.worksheetCount || 0} worksheets</span>
        </div>
      </div>

      {/* Chapter Info Form */}
      <ChapterInfoForm chapter={chapter} onUpdate={(updated) => setChapter(ch => ({ ...ch, ...updated }))} />

      {/* Content Sections */}
      <ItemSection
        title="Lectures"
        icon={Video}
        items={lectures}
        onMoveUp={(i) => moveItem('lecture', i, -1)}
        onMoveDown={(i) => moveItem('lecture', i, 1)}
        onUpdate={handleItemUpdate}
      />

      <ItemSection
        title="Notes"
        icon={FileText}
        items={notes}
        onMoveUp={(i) => moveItem('notes', i, -1)}
        onMoveDown={(i) => moveItem('notes', i, 1)}
        onUpdate={handleItemUpdate}
      />

      <ItemSection
        title="Worksheets"
        icon={BookOpen}
        items={worksheets}
        onMoveUp={(i) => moveItem('worksheet', i, -1)}
        onMoveDown={(i) => moveItem('worksheet', i, 1)}
        onUpdate={handleItemUpdate}
      />

      {items.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <p>No content found for this chapter.</p>
          <p className="text-sm mt-1">Add files to the chapter folder and rescan, or add YouTube videos.</p>
        </div>
      )}
    </div>
  );
}
