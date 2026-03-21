import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Video, FileText, BookOpen, Play, CheckCircle, Circle,
  ExternalLink, Plus, GripVertical, X, Loader2, StickyNote, Clock, ChevronDown, ChevronRight, Trash2
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getChapter, getChapterItems, toggleComplete, reorderItems,
  addYoutubeVideo, addManualLecture, getChapterNotes, deleteNote
} from '../lib/api.js';
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

// ── Add YouTube modal ──────────────────────────────────────────────────────────
function AddYoutubeModal({ chapterId, onClose, onAdded }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) { setError('URL is required'); return; }
    setLoading(true); setError('');
    try {
      await addYoutubeVideo(chapterId, { url, name: name || undefined, type: 'lecture' });
      onAdded();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-md rounded-xl p-6 border" style={{ background: '#1F2937', borderColor: '#262C36' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-card">Add YouTube Video</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-card"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">YouTube URL *</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..." required />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Custom Name (optional)</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Video title" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-text-secondary border hover:bg-accent"
              style={{ borderColor: '#262C36' }}>Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary"
              style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Adding...' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Manual Lecture modal ───────────────────────────────────────────────────
function AddManualModal({ chapterId, type, onClose, onAdded }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true); setError('');
    try {
      await addManualLecture(chapterId, { name: name.trim(), type });
      onAdded();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const label = type === 'lecture' ? 'Manual Lecture' : type === 'notes' ? 'Notes Item' : 'Worksheet Item';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-sm rounded-xl p-6 border" style={{ background: '#1F2937', borderColor: '#262C36' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-card">Add {label}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-card"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Kinematics Part 1" autoFocus />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-text-secondary border hover:bg-accent"
              style={{ borderColor: '#262C36' }}>Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary"
              style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sortable item row ──────────────────────────────────────────────────────────
function SortableItemRow({ item, onUpdate }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

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
    } catch (err) { console.error(err); }
    finally { setToggling(false); }
  };

  const isVideo = item.itemType === 'local_video' || item.itemType === 'youtube';
  const isManual = item.itemType === 'manual';
  const videoProgress = isVideo && item.duration > 0
    ? Math.min(100, Math.round(((item.currentTime || 0) / item.duration) * 100)) : null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ ...style, background: '#1E293B', borderColor: '#262C36' }}
        className="flex items-center gap-3 p-3.5 rounded-xl border group transition-colors hover:border-primary/30"
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-text-muted hover:text-text-card cursor-grab active:cursor-grabbing flex-shrink-0 touch-none opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>

        {/* Icon */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: isVideo ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)' }}>
          {isVideo
            ? <Play size={14} style={{ color: item.itemType === 'youtube' ? '#EF4444' : '#6366F1' }} />
            : <FileText size={14} style={{ color: '#F59E0B' }} />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${completed ? 'line-through text-text-muted' : 'text-text-card'}`}>
            {item.name}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {videoProgress !== null && (
              <>
                <ProgressBar value={videoProgress} height={3} className="w-24" />
                <span className="text-xs text-text-muted">
                  {item.currentTime ? formatDuration(item.currentTime) : '0:00'}
                  {item.duration ? ` / ${formatDuration(item.duration)}` : ''}
                </span>
              </>
            )}
            {item.itemType === 'youtube' && <span className="text-xs text-red-400">YouTube</span>}
            {isManual && <span className="text-xs text-text-muted">Manual</span>}
          </div>
        </div>

        {item.duration > 0 && (
          <span className="text-xs text-text-muted flex-shrink-0">{formatDuration(item.duration)}</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              if (isVideo || isManual) {
                setPlayerOpen(true);
              } else if (item.filePath) {
                window.open(`/api/files/document/${item.filePath}`, '_blank');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-primary hover:opacity-90 transition-opacity"
          >
            {isVideo ? <><Play size={11} /> Play</> : <><ExternalLink size={11} /> Open</>}
          </button>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`p-1.5 rounded-lg transition-colors ${completed ? 'text-green-400' : 'text-text-muted hover:text-green-400'}`}
          >
            {toggling ? <Loader2 size={16} className="animate-spin" /> : completed ? <CheckCircle size={16} /> : <Circle size={16} />}
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

// ── DnD item list for one tab ──────────────────────────────────────────────────
function SortableItemList({ items, chapterId, type, onUpdate }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [localItems, setLocalItems] = useState(items);
  useEffect(() => { setLocalItems(items); }, [items]);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = localItems.findIndex(i => i._id === active.id);
    const newIdx = localItems.findIndex(i => i._id === over.id);
    const reordered = arrayMove(localItems, oldIdx, newIdx);
    setLocalItems(reordered);
    try {
      const updates = reordered.map((item, i) => ({ id: item._id, order: i }));
      await reorderItems(chapterId, updates);
    } catch (err) {
      console.error(err);
      setLocalItems(items);
    }
  };

  if (!localItems.length) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        No {type} content yet.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localItems.map(i => i._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {localItems.map(item => (
            <SortableItemRow key={item._id} item={item} onUpdate={onUpdate} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ── My Notes tab ──────────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function NoteRow({ note, item, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [playerItem, setPlayerItem] = useState(null);

  const hasTimestamp = note.timestamp !== null && note.timestamp !== undefined;
  const canSeek = hasTimestamp && item;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNote(note._id);
      onDelete(note._id);
    } catch (err) { console.error(err); setDeleting(false); }
  };

  return (
    <>
      <div
        className="flex items-start gap-3 p-3 rounded-lg group transition-colors"
        style={{ background: '#1A2234' }}
      >
        {/* Timestamp badge */}
        <div className="flex-shrink-0 mt-0.5 w-16">
          {hasTimestamp ? (
            <button
              onClick={() => canSeek && setPlayerItem({ ...item, currentTime: note.timestamp })}
              disabled={!canSeek}
              title={canSeek ? `Jump to ${formatTime(note.timestamp)}` : undefined}
              className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded w-full justify-center transition-colors ${
                canSeek
                  ? 'text-primary border border-primary/40 hover:bg-primary hover:text-white cursor-pointer'
                  : 'text-text-muted border border-transparent cursor-default'
              }`}
            >
              <Clock size={9} />{formatTime(note.timestamp)}
            </button>
          ) : (
            <span className="text-xs text-text-muted pl-1">—</span>
          )}
        </div>

        <p className="flex-1 text-sm text-text-card leading-relaxed">{note.content}</p>

        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {canSeek && (
            <button
              onClick={() => setPlayerItem({ ...item, currentTime: note.timestamp })}
              className="p-1 rounded text-text-muted hover:text-primary transition-colors"
              title="Open video here"
            >
              <Play size={12} />
            </button>
          )}
          <button onClick={handleDelete} disabled={deleting}
            className="p-1 rounded text-text-muted hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {playerItem && (
        <VideoPlayer
          item={playerItem}
          onClose={() => setPlayerItem(null)}
          onComplete={() => setPlayerItem(null)}
        />
      )}
    </>
  );
}

function ItemNotesGroup({ group, onDeleteNote }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#262C36' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-accent transition-colors"
        style={{ background: '#161B22' }}
      >
        {open ? <ChevronDown size={13} className="text-text-muted" /> : <ChevronRight size={13} className="text-text-muted" />}
        <StickyNote size={13} className="text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-text-card flex-1 truncate">{group.itemName}</span>
        <span className="text-xs text-text-muted flex-shrink-0 ml-2">
          {group.notes.length} {group.notes.length === 1 ? 'note' : 'notes'}
        </span>
      </button>

      {open && (
        <div className="overflow-y-auto" style={{ background: '#0F1117', maxHeight: '320px' }}>
          <div className="p-2 space-y-1.5">
            {group.notes.map(note => (
              <NoteRow key={note._id} note={note} item={group.item} onDelete={onDeleteNote} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MyNotesTab({ chapterId }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChapterNotes(chapterId)
      .then(setGroups)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [chapterId]);

  const handleDeleteNote = (noteId) => {
    setGroups(prev =>
      prev.map(g => ({ ...g, notes: g.notes.filter(n => n._id !== noteId) }))
          .filter(g => g.notes.length > 0)
    );
  };

  const totalNotes = groups.reduce((s, g) => s + g.notes.length, 0);

  if (loading) {
    return <div className="py-8 text-center text-text-muted text-sm">Loading notes…</div>;
  }

  if (!groups.length) {
    return (
      <div className="py-12 text-center text-text-muted">
        <StickyNote size={36} className="mx-auto mb-2 opacity-20" />
        <p className="text-sm">No notes yet. Add notes while watching lectures.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted flex items-center gap-1 pb-1">
        <Clock size={11} /> {totalNotes} notes — click a timestamp to jump to that moment in the video
      </p>
      {groups.map(group => (
        <ItemNotesGroup key={group.itemId} group={group} onDeleteNote={handleDeleteNote} />
      ))}
    </div>
  );
}

// ── Main ChapterPage ───────────────────────────────────────────────────────────
const TABS = ['Lectures', 'Notes', 'Worksheets', 'My Notes'];

export default function ChapterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Lectures');
  const [modal, setModal] = useState(null); // 'youtube' | 'manual' | null

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

  const handleUpdate = async () => {
    const [chapterData, itemsData] = await Promise.all([
      getChapter(id),
      getChapterItems(id)
    ]);
    setChapter(chapterData);
    setItems(itemsData);
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

  const lectures   = items.filter(i => i.type === 'lecture').sort((a, b) => a.order - b.order);
  const notes      = items.filter(i => i.type === 'notes').sort((a, b) => a.order - b.order);
  const worksheets = items.filter(i => i.type === 'worksheet').sort((a, b) => a.order - b.order);
  const tabItems   = { Lectures: lectures, Notes: notes, Worksheets: worksheets };

  const color = SUBJECT_COLORS[chapter.subject] || '#6366F1';
  const { stats = {} } = chapter;
  const progress = stats.lectureProgress ?? stats.progress ?? 0;

  const TAB_ICONS = { Lectures: Video, Notes: FileText, Worksheets: BookOpen, 'My Notes': StickyNote };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/subject/${chapter.subject}`)}
        className="flex items-center gap-2 text-text-muted hover:text-text-card transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to {chapter.subject}
      </button>

      {/* Header card */}
      <div className="rounded-xl p-6 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm text-text-muted mb-1" style={{ color }}>{chapter.subject}</div>
            <h1 className="text-2xl font-bold text-text-card">{chapter.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {chapter.eisenhowerLabel && <EisenhowerBadge value={chapter.eisenhowerLabel} />}
              {chapter.confidence && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  chapter.confidence === 'high' ? 'bg-green-900 text-green-400' :
                  chapter.confidence === 'moderate' ? 'bg-yellow-900 text-yellow-400' :
                  'bg-red-900 text-red-400'
                }`}>{chapter.confidence} confidence</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color }}>{progress}%</div>
            <p className="text-xs text-text-muted mt-1">
              {stats.completedLectures ?? 0}/{stats.totalLectures ?? 0} lectures done
            </p>
            {(stats.totalNotes ?? 0) > 0 && (
              <p className="text-xs text-text-muted">
                {stats.completedNotes ?? 0}/{stats.totalNotes ?? 0} notes
              </p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={progress} color={color} height={8} />
        </div>
        <div className="flex gap-6 mt-4 text-sm text-text-muted">
          <span className="flex items-center gap-1"><Video size={14} /> {stats.totalLectures ?? 0} lectures</span>
          <span className="flex items-center gap-1"><FileText size={14} /> {stats.totalNotes ?? 0} notes</span>
          <span className="flex items-center gap-1"><BookOpen size={14} /> {stats.totalWorksheets ?? 0} worksheets</span>
        </div>
      </div>

      {/* Chapter Info Form */}
      <ChapterInfoForm chapter={chapter} onUpdate={(updated) => setChapter(ch => ({ ...ch, ...updated }))} />

      {/* Tabs */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#161B22', borderColor: '#262C36' }}>
        {/* Tab bar */}
        <div className="flex border-b" style={{ borderColor: '#262C36' }}>
          {TABS.map(tab => {
            const Icon = TAB_ICONS[tab];
            const count = tab !== 'My Notes' ? tabItems[tab]?.length ?? 0 : null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-primary border-primary'
                    : 'text-text-muted border-transparent hover:text-text-card'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab}</span>
                {count !== null && count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: activeTab === tab ? 'rgba(99,102,241,0.2)' : '#262C36', color: activeTab === tab ? '#6366F1' : '#64748B' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add buttons — hidden on My Notes tab */}
        {activeTab !== 'My Notes' && (
          <div className="flex gap-2 p-4 border-b" style={{ borderColor: '#262C36' }}>
            {activeTab === 'Lectures' && (
              <>
                <button
                  onClick={() => setModal('youtube')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white border"
                  style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}
                >
                  <Plus size={13} /> YouTube Video
                </button>
                <button
                  onClick={() => setModal('manual')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-accent text-text-secondary"
                  style={{ borderColor: '#262C36' }}
                >
                  <Plus size={13} /> Manual Lecture
                </button>
              </>
            )}
            {(activeTab === 'Notes' || activeTab === 'Worksheets') && (
              <button
                onClick={() => setModal('manual')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-accent text-text-secondary"
                style={{ borderColor: '#262C36' }}
              >
                <Plus size={13} /> Add {activeTab === 'Notes' ? 'Notes' : 'Worksheet'} Item
              </button>
            )}
          </div>
        )}

        {/* Tab content */}
        <div className="p-4">
          {activeTab === 'My Notes' ? (
            <MyNotesTab chapterId={id} />
          ) : (
            <SortableItemList
              key={activeTab}
              items={tabItems[activeTab]}
              chapterId={id}
              type={activeTab.toLowerCase()}
              onUpdate={handleUpdate}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === 'youtube' && (
        <AddYoutubeModal
          chapterId={id}
          onClose={() => setModal(null)}
          onAdded={handleUpdate}
        />
      )}
      {modal === 'manual' && (
        <AddManualModal
          chapterId={id}
          type={activeTab === 'Lectures' ? 'lecture' : activeTab === 'Notes' ? 'notes' : 'worksheet'}
          onClose={() => setModal(null)}
          onAdded={handleUpdate}
        />
      )}
    </div>
  );
}
