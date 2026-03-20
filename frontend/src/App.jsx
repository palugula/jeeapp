import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SubjectPage from './pages/SubjectPage.jsx';
import SubjectNotesPage from './pages/SubjectNotesPage.jsx';
import ChapterPage from './pages/ChapterPage.jsx';
import Analytics from './pages/Analytics.jsx';
import WeeklyPlan from './pages/WeeklyPlan.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="subject/:subject" element={<SubjectPage />} />
            <Route path="subject/:subject/notes" element={<SubjectNotesPage />} />
            <Route path="chapter/:id" element={<ChapterPage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="weekly-plan" element={<WeeklyPlan />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
