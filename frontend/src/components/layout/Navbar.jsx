import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { useApp } from '../../contexts/AppContext.jsx';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/analytics': 'Analytics',
  '/weekly-plan': 'Weekly Plan',
  '/settings': 'Settings'
};

export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  const { settings } = useApp();

  const getTitle = () => {
    if (location.pathname.startsWith('/subject/')) {
      const sub = location.pathname.split('/')[2];
      return sub;
    }
    if (location.pathname.startsWith('/chapter/')) return 'Chapter Details';
    return PAGE_TITLES[location.pathname] || 'JEE Prep';
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ background: '#161B22', borderColor: '#262C36' }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-accent text-text-accent transition-colors"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-lg font-semibold text-text-card">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-text-card">{settings.userName || 'JEE Aspirant'}</p>
          <p className="text-xs text-text-muted">Keep going!</p>
        </div>
        {settings.profilePicture ? (
          <img
            src={settings.profilePicture}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border-2 border-primary"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            {(settings.userName || 'J')[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
