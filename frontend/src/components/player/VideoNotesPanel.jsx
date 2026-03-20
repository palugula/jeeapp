import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, StickyNote } from 'lucide-react';
import { getItemNotes, addNote, deleteNote } from '../../lib/api.js';

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoNotesPanel({ item, getCurrentTime, onSeek }) {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item?._id) return;
    getItemNotes(item._id).then(setNotes).catch(console.error);
  }, [item?._id]);

  const handleCaptureTime = () => {
    const t = getCurrentTime ? getCurrentTime() : null;
    if (t !== null && t !== undefined) {
      setTimestamp(String(Math.floor(t)));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const note = await addNote(item._id, {
        content: content.trim(),
        timestamp: timestamp !== '' ? Number(timestamp) : null
      });
      setNotes(prev => [...prev, note]);
      setContent('');
      setTimestamp('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n._id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0F1117' }}>
      {/* Header */}
      <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: '#262C36', background: '#161B22' }}>
        <StickyNote size={14} className="text-primary" />
        <span className="text-sm font-semibold text-text-card">Notes</span>
        <span className="text-xs text-text-muted ml-auto">{notes.length}</span>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notes.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">No notes yet</p>
        )}
        {notes.map(note => (
          <div
            key={note._id}
            className="group rounded-lg p-2.5 border"
            style={{ background: '#161B22', borderColor: '#262C36' }}
          >
            {note.timestamp !== null && note.timestamp !== undefined && (
              <button
                onClick={() => onSeek && onSeek(note.timestamp)}
                className="flex items-center gap-1 text-xs font-mono mb-1.5 hover:underline"
                style={{ color: '#6366F1' }}
              >
                <Clock size={10} />
                {formatTime(note.timestamp)}
              </button>
            )}
            <div className="flex items-start gap-2">
              <p className="flex-1 text-xs text-text-card leading-relaxed">{note.content}</p>
              <button
                onClick={() => handleDelete(note._id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add note form */}
      <form onSubmit={handleAdd} className="p-3 border-t space-y-2" style={{ borderColor: '#262C36' }}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={timestamp}
            onChange={e => setTimestamp(e.target.value)}
            placeholder="Time (s)"
            className="w-24 text-xs"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            min="0"
          />
          {getCurrentTime && (
            <button
              type="button"
              onClick={handleCaptureTime}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors hover:bg-accent text-text-muted"
              style={{ borderColor: '#262C36' }}
            >
              <Clock size={10} />
              Now
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="flex-1 text-xs resize-none"
            style={{ padding: '6px 8px', fontSize: '12px' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd(e);
            }}
          />
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="self-end px-2 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            <Plus size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
