import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, parseISO, startOfWeek, addDays, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react';
import { getWeekPlan, addWeekTask, updateWeekTask, deleteWeekTask, getSubjectChapters } from '../lib/api.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SUBJECTS = ['Maths', 'Physics', 'Chemistry'];
const SUBJECT_COLORS = { Maths: '#6366F1', Physics: '#10B981', Chemistry: '#F59E0B' };

function getWeekStart(date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

function AddTaskModal({ weekStart, weekDates, onClose, onAdded }) {
  const [subject, setSubject] = useState('Maths');
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [startDate, setStartDate] = useState(weekDates[0]);
  const [endDate, setEndDate] = useState(weekDates[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSubjectChapters(subject).then(data => {
      setChapters(data);
      if (data.length) { setChapterId(data[0]._id); setChapterName(data[0].name); }
      else { setChapterId(''); setChapterName(''); }
    }).catch(console.error);
  }, [subject]);

  const handleChapterChange = (e) => {
    const ch = chapters.find(c => c._id === e.target.value);
    if (!ch) return;
    setChapterId(ch._id);
    setChapterName(ch.name);
  };

  const handleAdd = async () => {
    if (!chapterId) { setError('Select a chapter'); return; }
    if (endDate < startDate) { setError('End date must be ≥ start date'); return; }
    setLoading(true); setError('');
    try {
      await addWeekTask(weekStart, {
        chapterId, subject, chapterName, taskTitle,
        startDate, endDate, startTime, endTime
      });
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-card">Add Task</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-card"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Chapter</label>
            <select value={chapterId} onChange={handleChapterChange}>
              {chapters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Task / Notes (optional)</label>
            <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
              placeholder="e.g. Watch lecture 3, solve PYQs…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Start Date</label>
              <select value={startDate} onChange={e => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }}>
                {weekDates.map(d => <option key={d} value={d}>{format(parseISO(d), 'EEE, MMM d')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">End Date</label>
              <select value={endDate} onChange={e => setEndDate(e.target.value)}>
                {weekDates.filter(d => d >= startDate).map(d => <option key={d} value={d}>{format(parseISO(d), 'EEE, MMM d')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Start Time (optional)</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">End Time (optional)</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm border text-text-secondary hover:bg-accent"
            style={{ borderColor: '#262C36' }}>Cancel</button>
          <button onClick={handleAdd} disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary"
            style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyPlan() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const weekStart = getWeekStart(currentWeek);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(parseISO(weekStart), i), 'yyyy-MM-dd')
  );

  const loadPlan = async () => {
    setLoading(true);
    try {
      const data = await getWeekPlan(weekStart);
      setPlan(data);
    } catch (err) {
      console.error(err);
      setPlan({ weekStart, tasks: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlan(); }, [weekStart]);

  const handleToggle = async (task) => {
    const newCompleted = !task.completed;
    setPlan(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t._id === task._id ? { ...t, completed: newCompleted } : t)
    }));
    try {
      await updateWeekTask(weekStart, task._id, { completed: newCompleted });
    } catch (err) {
      console.error(err);
      loadPlan();
    }
  };

  const handleDelete = async (task) => {
    setPlan(prev => ({ ...prev, tasks: prev.tasks.filter(t => t._id !== task._id) }));
    try {
      await deleteWeekTask(weekStart, task._id);
    } catch (err) {
      console.error(err);
      loadPlan();
    }
  };

  const tasks = plan?.tasks || [];
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-card">Weekly Plan</h1>
          <p className="text-text-muted text-sm mt-1">
            {format(parseISO(weekStart), 'MMM d')} – {format(addDays(parseISO(weekStart), 6), 'MMM d, yyyy')}
            {tasks.length > 0 && ` • ${completedCount}/${tasks.length} done`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary"
          >
            <Plus size={14} /> Add Task
          </button>

          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentWeek(w => subWeeks(w, 1))}
              className="p-2 rounded-lg hover:bg-accent text-text-muted border" style={{ borderColor: '#262C36' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border hover:bg-accent" style={{ borderColor: '#262C36' }}>
              Today
            </button>
            <button onClick={() => setCurrentWeek(w => addWeeks(w, 1))}
              className="p-2 rounded-lg hover:bg-accent text-text-muted border" style={{ borderColor: '#262C36' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-3">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: '#161B22' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDates.map((dateStr, di) => {
            const date = parseISO(dateStr);
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

            // Tasks that span this day
            const dayTasks = tasks.filter(t => t.startDate <= dateStr && t.endDate >= dateStr);

            return (
              <div
                key={dateStr}
                className="rounded-xl border overflow-hidden"
                style={{ background: '#161B22', borderColor: isToday ? '#6366F1' : '#262C36' }}
              >
                {/* Day header */}
                <div className="px-3 py-2 text-center border-b"
                  style={{ background: isToday ? 'rgba(99,102,241,0.12)' : 'transparent', borderColor: '#262C36' }}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                    {DAYS[di]}
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-text-card'}`}>
                    {format(date, 'd')}
                  </p>
                </div>

                {/* Tasks */}
                <div className="p-2 space-y-1.5 min-h-28">
                  {dayTasks.map(task => {
                    const color = SUBJECT_COLORS[task.subject] || '#6366F1';
                    const isFirst = task.startDate === dateStr;
                    const isLast = task.endDate === dateStr;

                    return (
                      <div
                        key={task._id}
                        className="group relative p-2 rounded-lg text-xs"
                        style={{
                          background: task.completed ? '#0f2e1f' : `${color}18`,
                          borderLeft: `2px solid ${color}`
                        }}
                      >
                        <div className="flex items-start gap-1">
                          <button
                            onClick={() => handleToggle(task)}
                            className="flex-shrink-0 mt-0.5"
                          >
                            {task.completed
                              ? <Check size={10} className="text-green-400" />
                              : <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${task.completed ? 'line-through text-text-muted' : 'text-text-card'}`}>
                              {task.chapterName}
                            </p>
                            {task.taskTitle && (
                              <p className="text-text-muted truncate mt-0.5">{task.taskTitle}</p>
                            )}
                            {/* Show time only on first day */}
                            {isFirst && (task.startTime || task.endTime) && (
                              <p className="text-text-muted mt-0.5">
                                {task.startTime}{task.startTime && task.endTime ? ' – ' : ''}{task.endTime}
                              </p>
                            )}
                            {/* Span indicator */}
                            {task.startDate !== task.endDate && (
                              <p className="text-text-muted mt-0.5 opacity-70">
                                {isFirst ? `→ ${format(parseISO(task.endDate), 'MMM d')}` :
                                 isLast ? `← ${format(parseISO(task.startDate), 'MMM d')}` :
                                 '↔'}
                              </p>
                            )}
                          </div>
                          {/* Delete — only show on first day to avoid duplicates */}
                          {isFirst && (
                            <button
                              onClick={() => handleDelete(task)}
                              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all flex-shrink-0"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddTaskModal
          weekStart={weekStart}
          weekDates={weekDates}
          onClose={() => setShowAddModal(false)}
          onAdded={loadPlan}
        />
      )}
    </div>
  );
}
