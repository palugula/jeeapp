import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, StickyNote, ChevronDown, ChevronRight, Trash2, Clock, Play } from 'lucide-react';
import { getSubjectNotes, deleteNote } from '../lib/api.js';
import VideoPlayer from '../components/player/VideoPlayer.jsx';

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Pure display row — no VideoPlayer here, player is lifted to page level
function NoteRow({ note, item, onPlay, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const hasTimestamp = note.timestamp !== null && note.timestamp !== undefined;
  const canOpen = !!item;

  const handleDelete = async (e) => {
    e.stopPropagation();
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
      onClick={() => canOpen && onPlay(item, hasTimestamp ? note.timestamp : null)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-colors ${canOpen ? 'cursor-pointer hover:bg-primary/10' : ''}`}
      style={{ background: '#1A2234' }}
      title={canOpen ? (hasTimestamp ? `Open video at ${formatTime(note.timestamp)}` : 'Open video') : undefined}
    >
      {/* Timestamp or play icon */}
      <div className="flex-shrink-0 w-14 flex justify-center">
        {hasTimestamp ? (
          <span
            className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border"
            style={{ color: '#6366F1', borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)' }}
          >
            <Clock size={9} />{formatTime(note.timestamp)}
          </span>
        ) : (
          <span className="opacity-30 group-hover:opacity-60 transition-opacity">
            <Play size={12} className="text-text-muted" />
          </span>
        )}
      </div>

      {/* Content */}
      <p className="flex-1 text-sm text-text-card leading-relaxed">{note.content}</p>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function ItemSection({ itemGroup, onPlay, onDeleteNote }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border" style={{ borderColor: '#262C36' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-t-lg text-left hover:bg-accent transition-colors"
        style={{ background: '#161B22' }}
      >
        {open
          ? <ChevronDown size={13} className="text-text-muted flex-shrink-0" />
          : <ChevronRight size={13} className="text-text-muted flex-shrink-0" />}
        <StickyNote size={13} className="text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-text-card flex-1 truncate">
          {itemGroup.itemName}
        </span>
        <span className="text-xs text-text-muted flex-shrink-0 ml-2">
          {itemGroup.notes.length} {itemGroup.notes.length === 1 ? 'note' : 'notes'}
        </span>
      </button>

      {/* Scrollable notes list — no overflow-hidden on parent */}
      {open && (
        <div
          className="overflow-y-auto rounded-b-lg"
          style={{ background: '#0F1117', maxHeight: '300px' }}
        >
          <div className="p-2 space-y-1">
            {itemGroup.notes.map(note => (
              <NoteRow
                key={note._id}
                note={note}
                item={itemGroup.item}
                onPlay={onPlay}
                onDelete={onDeleteNote}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterSection({ chapter, onPlay, onDeleteNote }) {
  const [open, setOpen] = useState(true);
  const totalNotes = chapter.items.reduce((s, i) => s + i.notes.length, 0);

  return (
    <div className="rounded-xl border" style={{ background: '#161B22', borderColor: '#262C36' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-accent transition-colors"
      >
        {open
          ? <ChevronDown size={15} className="text-text-muted flex-shrink-0" />
          : <ChevronRight size={15} className="text-text-muted flex-shrink-0" />}
        <h3 className="font-semibold text-text-card flex-1 text-left truncate">
          {chapter.chapterName}
        </h3>
        <span className="text-xs text-text-muted flex-shrink-0 ml-2">
          {chapter.items.length} items · {totalNotes} notes
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {chapter.items.map(itemGroup => (
            <ItemSection
              key={itemGroup.itemId}
              itemGroup={itemGroup}
              onPlay={onPlay}
              onDeleteNote={onDeleteNote}
            />
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
  // VideoPlayer lifted to page level — outside all scroll/overflow containers
  const [playerItem, setPlayerItem] = useState(null);

  const load = async () => {
    try {
      const data = await getSubjectNotes(subject);
      setChapters(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [subject]);

  const handlePlay = (item, timestamp) => {
    setPlayerItem({ ...item, currentTime: timestamp ?? item.currentTime ?? 0 });
  };

  const handleDeleteNote = (noteId) => {
    setChapters(prev =>
      prev.map(ch => ({
        ...ch,
        items: ch.items
          .map(it => ({ ...it, notes: it.notes.filter(n => n._id !== noteId) }))
          .filter(it => it.notes.length > 0)
      })).filter(ch => ch.items.length > 0)
    );
  };

  const totalNotes = chapters.reduce((s, ch) =>
    s + ch.items.reduce((si, it) => si + it.notes.length, 0), 0
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/subject/${subject}`)}
        className="flex items-center gap-2 text-text-muted hover:text-text-card transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to {subject}
      </button>

      {/* Header */}
      <div className="rounded-xl p-5 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <h1 className="text-2xl font-bold text-text-card">{subject} — Study Notes</h1>
        <p className="text-text-muted text-sm mt-1">
          {totalNotes} notes across {chapters.length} chapters
        </p>
        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#6366F1' }}>
          <Clock size={11} />
          Click any note row to open the video · timestamp rows jump to that exact moment
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: '#161B22' }} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && chapters.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <StickyNote size={44} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No notes yet</p>
          <p className="text-sm mt-1">Open a lecture and add notes from the panel on the right.</p>
        </div>
      )}

      {/* Chapter → Item → Notes */}
      {!loading && chapters.map(chapter => (
        <ChapterSection
          key={chapter.chapterId}
          chapter={chapter}
          onPlay={handlePlay}
          onDeleteNote={handleDeleteNote}
        />
      ))}

      {/* VideoPlayer at page level — never clipped by scroll containers */}
      {playerItem && (
        <VideoPlayer
          item={playerItem}
          onClose={() => setPlayerItem(null)}
          onComplete={() => setPlayerItem(null)}
        />
      )}
    </div>
  );
}
