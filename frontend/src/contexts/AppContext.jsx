import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, getSubjects } from '../lib/api.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState({
    userName: 'JEE Aspirant',
    jeeExamDate: null,
    profilePicture: null,
    bannerImage: null
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.warn('Could not load settings:', err.message);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch (err) {
      console.warn('Could not load subjects:', err.message);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadSettings(), loadSubjects()]);
      setLoading(false);
    }
    init();
  }, [loadSettings, loadSubjects]);

  const refreshSubjects = () => loadSubjects();
  const refreshSettings = () => loadSettings();

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider value={{
      settings,
      subjects,
      loading,
      refreshSubjects,
      refreshSettings,
      updateSettings
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
