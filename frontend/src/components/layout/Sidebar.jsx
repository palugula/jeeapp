import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, BarChart2, Calendar,
  Settings, ChevronLeft, ChevronRight, FlaskConical,
  Calculator, Atom
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';

const SUBJECT_ICONS = {
  Maths: Calculator,
  Physics: Atom,
  Chemistry: FlaskConical
};

const SUBJECT_COLORS = {
  Maths: '#6366F1',
  Physics: '#10B981',
  Chemistry: '#F59E0B'
};

export default function Sidebar({ open, onToggle }) {
  const { subjects } = useApp();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
      isActive
        ? 'bg-primary text-white'
        : 'text-text-secondary hover:bg-accent hover:text-text-card'
    }`;

  return (
    <div
      className="sidebar-transition flex flex-col border-r"
      style={{
        width: open ? '240px' : '64px',
        background: '#161B22',
        borderColor: '#262C36',
        minHeight: '100vh'
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#262C36' }}>
        {open && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">J</div>
            <span className="font-bold text-text-card">JEE Prep</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-accent text-text-accent transition-colors ml-auto"
        >
          {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavLink to="/" end className={navLinkClass}>
          <LayoutDashboard size={18} className="shrink-0" />
          {open && <span>Dashboard</span>}
        </NavLink>

        {open && (
          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-1">Subjects</p>
          </div>
        )}

        {['Maths', 'Physics', 'Chemistry'].map(subject => {
          const Icon = SUBJECT_ICONS[subject];
          const color = SUBJECT_COLORS[subject];
          const subjectData = subjects.find(s => s.name === subject);
          const progress = subjectData?.progress || 0;

          return (
            <NavLink key={subject} to={`/subject/${subject}`} className={navLinkClass}>
              <Icon size={18} className="shrink-0" style={{ color }} />
              {open && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span>{subject}</span>
                    <span className="text-xs text-text-muted">{progress}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full mt-1" style={{ background: '#262C36' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, background: color }}
                    />
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}

        {open && (
          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-1">Tools</p>
          </div>
        )}

        <NavLink to="/analytics" className={navLinkClass}>
          <BarChart2 size={18} className="shrink-0" />
          {open && <span>Analytics</span>}
        </NavLink>

        <NavLink to="/weekly-plan" className={navLinkClass}>
          <Calendar size={18} className="shrink-0" />
          {open && <span>Weekly Plan</span>}
        </NavLink>
      </nav>

      {/* Settings at bottom */}
      <div className="p-3 border-t" style={{ borderColor: '#262C36' }}>
        <NavLink to="/settings" className={navLinkClass}>
          <Settings size={18} className="shrink-0" />
          {open && <span>Settings</span>}
        </NavLink>
      </div>
    </div>
  );
}
