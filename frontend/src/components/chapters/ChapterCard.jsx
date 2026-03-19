import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Plus, Video, FileText, BookOpen } from 'lucide-react';
import ProgressBar from '../common/ProgressBar.jsx';
import { EisenhowerBadge } from '../common/Badge.jsx';
import ContentItemRow from './ContentItemRow.jsx';
import { reorderChapters, addYoutubeVideo, reorderItems, getChapterItems } from '../../lib/api.js';

function AddYoutubeModal({ chapterId, onClose, onAdded }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) { setError('URL is required'); return; }
    setLoading(true);
    setError('');
    try {
      await addYoutubeVideo(chapterId, { url, name: name || undefined, type: 'lecture' });
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-md rounded-xl p-6 border" style={{ background: '#1F2937', borderColor: '#262C36' }}>
        <h3 className="text-lg font-bold text-text-card mb-4">Add YouTube Video</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">YouTube URL *</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Custom Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Video title"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-text-secondary border transition-colors hover:bg-accent"
              style={{ borderColor: '#262C36' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary transition-opacity"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Adding...' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChapterCard({ chapter, index, total, onMoveUp, onMoveDown, onReload }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);

  const loadItems = async () => {
    if (items.length > 0 && !loadingItems) return;
    setLoadingItems(true);
    try {
      const data = await getChapterItems(chapter._id);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleExpand = () => {
    if (!expanded) loadItems();
    setExpanded(!expanded);
  };

  const handleItemUpdate = async () => {
    const data = await getChapterItems(chapter._id);
    setItems(data);
  };

  const moveItem = async (type, index, direction) => {
    const typeItems = items.filter(i => i.type === type).sort((a, b) => a.order - b.order);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= typeItems.length) return;

    const reordered = [...typeItems];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const updates = reordered.map((item, i) => ({ id: item._id, order: i }));

    await reorderItems(chapter._id, updates);
    await handleItemUpdate();
  };

  const lectures = items.filter(i => i.type === 'lecture').sort((a, b) => a.order - b.order);
  const notes = items.filter(i => i.type === 'notes').sort((a, b) => a.order - b.order);
  const worksheets = items.filter(i => i.type === 'worksheet').sort((a, b) => a.order - b.order);

  const { stats = {} } = chapter;

  return (
    <>
      <div className="rounded-xl border overflow-hidden" style={{ background: '#161B22', borderColor: '#262C36' }}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          {/* Reorder buttons */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="p-1 rounded text-text-muted hover:text-text-card hover:bg-accent transition-colors disabled:opacity-30"
            >
              <ArrowUp size={12} />
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === total - 1}
              className="p-1 rounded text-text-muted hover:text-text-card hover:bg-accent transition-colors disabled:opacity-30"
            >
              <ArrowDown size={12} />
            </button>
          </div>

          {/* Order number */}
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-text-accent">
            {index + 1}
          </div>

          {/* Title & info */}
          <div className="flex-1 min-w-0">
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
            <div className="flex items-center gap-4 mt-1">
              <ProgressBar value={stats.progress || 0} height={4} className="w-32" />
              <span className="text-xs text-text-muted">{stats.progress || 0}%</span>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Video size={10} /> {stats.lectureCount || 0}
              </span>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <FileText size={10} /> {stats.notesCount || 0}
              </span>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <BookOpen size={10} /> {stats.worksheetCount || 0}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowYoutubeModal(true); }}
              className="p-1.5 rounded-lg hover:bg-accent text-text-muted hover:text-red-400 transition-colors"
              title="Add YouTube Video"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={handleExpand}
              className="p-1.5 rounded-lg hover:bg-accent text-text-muted transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="border-t" style={{ borderColor: '#262C36' }}>
            {loadingItems ? (
              <div className="p-4 text-center text-text-muted text-sm">Loading...</div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#262C36' }}>
                {lectures.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                      <Video size={14} /> Lectures ({lectures.length})
                    </h4>
                    <div className="space-y-2">
                      {lectures.map((item, i) => (
                        <ContentItemRow
                          key={item._id}
                          item={item}
                          index={i}
                          total={lectures.length}
                          onMoveUp={() => moveItem('lecture', i, -1)}
                          onMoveDown={() => moveItem('lecture', i, 1)}
                          onUpdate={handleItemUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                      <FileText size={14} /> Notes ({notes.length})
                    </h4>
                    <div className="space-y-2">
                      {notes.map((item, i) => (
                        <ContentItemRow
                          key={item._id}
                          item={item}
                          index={i}
                          total={notes.length}
                          onMoveUp={() => moveItem('notes', i, -1)}
                          onMoveDown={() => moveItem('notes', i, 1)}
                          onUpdate={handleItemUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {worksheets.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
                      <BookOpen size={14} /> Worksheets ({worksheets.length})
                    </h4>
                    <div className="space-y-2">
                      {worksheets.map((item, i) => (
                        <ContentItemRow
                          key={item._id}
                          item={item}
                          index={i}
                          total={worksheets.length}
                          onMoveUp={() => moveItem('worksheet', i, -1)}
                          onMoveDown={() => moveItem('worksheet', i, 1)}
                          onUpdate={handleItemUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {items.length === 0 && (
                  <div className="p-4 text-center text-text-muted text-sm">
                    No content found. Try rescanning or adding YouTube videos.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showYoutubeModal && (
        <AddYoutubeModal
          chapterId={chapter._id}
          onClose={() => setShowYoutubeModal(false)}
          onAdded={() => { handleItemUpdate(); if (!expanded) { setExpanded(true); loadItems(); } }}
        />
      )}
    </>
  );
}
