import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, StickyNote, ChevronDown, ChevronRight, Trash2, Clock } from 'lucide-react';
import { getSubjectNotes, deleteNote } from '../lib/api.js';

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function NoteItem({ note, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNote(note._id);
      onDelete(note._id);
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg group"
      style={{ background: '#1E293B' }}
    >
      {note.timestamp !== null && note.timestamp !== undefined && (
        <span
          className="flex-shrink-0 text-xs font-mono px-2 py-0.5 rounded mt-0.5"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
        >
          <Clock size={10} className="inline mr-1" />
          {formatTime(note.timestamp)}
        </span>
      )}
      <p className="flex-1 text-sm text-text-card">{note.content}</p>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all flex-shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function ItemSection({ item, onDeleteNote }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#262C36' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-accent transition-colors"
        style={{ background: '#161B22' }}
      >
        {open ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
        <StickyNote size={14} className="text-primary" />
        <span className="text-sm font-medium text-text-card flex-1 truncate">{item.itemName}</span>
        <span className="text-xs text-text-muted">{item.notes.length} notes</span>
      </button>
      {open && (
        <div className="p-3 space-y-2" style={{ background: '#0F1117' }}>
          {item.notes.map(note => (
            <NoteItem
              key={note._id}
              note={note}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterSection({ chapter, onDeleteNote }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: '#161B22', borderColor: '#262C36' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors"
      >
        {open ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
        <h3 className="font-semibold text-text-card flex-1 text-left">{chapter.chapterName}</h3>
        <span className="text-xs text-text-muted">
          {chapter.items.reduce((s, i) => s + i.notes.length, 0)} notes
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {chapter.items.map(item => (
            <ItemSection key={item.itemId} item={item} onDeleteNote={onDeleteNote} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubjectNotesPage() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getSubjectNotes(subject);
      setChapters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [subject]);

  const handleDeleteNote = (noteId) => {
    setChapters(prev => prev.map(ch => ({
      ...ch,
      items: ch.items.map(it => ({
        ...it,
        notes: it.notes.filter(n => n._id !== noteId)
      })).filter(it => it.notes.length > 0)
    })).filter(ch => ch.items.length > 0));
  };

  const totalNotes = chapters.reduce((s, ch) =>
    s + ch.items.reduce((si, it) => si + it.notes.length, 0), 0
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(`/subject/${subject}`)}
        className="flex items-center gap-2 text-text-muted hover:text-text-card transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to {subject}
      </button>

      <div className="rounded-xl p-5 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <h1 className="text-2xl font-bold text-text-card">{subject} Notes</h1>
        <p className="text-text-muted text-sm mt-1">{totalNotes} notes across {chapters.length} chapters</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#161B22' }} />)}
        </div>
      )}

      {!loading && chapters.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <StickyNote size={40} className="mx-auto mb-3 opacity-30" />
          <p>No notes yet. Add notes while watching lectures.</p>
        </div>
      )}

      {!loading && chapters.map(chapter => (
        <ChapterSection
          key={chapter.chapterId}
          chapter={chapter}
          onDeleteNote={handleDeleteNote}
        />
      ))}
    </div>
  );
}
