import React, { useState, useRef } from 'react';
import { Save, Upload, RefreshCw, User, Calendar, Image } from 'lucide-react';
import { useApp } from '../contexts/AppContext.jsx';
import { updateSetting, uploadProfilePic, uploadBanner, rescanAll } from '../lib/api.js';

function Section({ title, children }) {
  return (
    <div className="rounded-xl p-6 border space-y-4" style={{ background: '#161B22', borderColor: '#262C36' }}>
      <h2 className="text-base font-bold text-text-card">{title}</h2>
      {children}
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, refreshSettings } = useApp();

  const [userName, setUserName] = useState(settings.userName || '');
  const [examDate, setExamDate] = useState(settings.jeeExamDate || '');
  const [saving, setSaving] = useState({});
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');

  const profileRef = useRef(null);
  const bannerRef = useRef(null);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const saveSetting = async (key, value) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await updateSetting(key, value);
      updateSettings({ [key]: value });
      showMessage('Saved!');
    } catch (err) {
      showMessage('Error: ' + err.message);
    } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const handleProfileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setSaving(s => ({ ...s, profilePic: true }));
    try {
      const result = await uploadProfilePic(formData);
      updateSettings({ profilePicture: result.url });
      showMessage('Profile picture updated!');
    } catch (err) {
      showMessage('Upload failed: ' + err.message);
    } finally {
      setSaving(s => ({ ...s, profilePic: false }));
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setSaving(s => ({ ...s, banner: true }));
    try {
      const result = await uploadBanner(formData);
      updateSettings({ bannerImage: result.url });
      showMessage('Banner updated!');
    } catch (err) {
      showMessage('Upload failed: ' + err.message);
    } finally {
      setSaving(s => ({ ...s, banner: false }));
    }
  };

  const handleRescan = async () => {
    setScanning(true);
    try {
      await rescanAll();
      showMessage('Rescan completed!');
    } catch (err) {
      showMessage('Error: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-card">Settings</h1>

      {message && (
        <div className="p-3 rounded-lg text-sm font-medium"
          style={{ background: message.startsWith('Error') ? '#7f1d1d' : '#065f46', color: '#fff' }}>
          {message}
        </div>
      )}

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4">
          {settings.profilePicture ? (
            <img
              src={settings.profilePicture}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
              {(userName || 'J')[0].toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={profileRef}
              type="file"
              accept="image/*"
              onChange={handleProfileUpload}
              className="hidden"
            />
            <button
              onClick={() => profileRef.current?.click()}
              disabled={saving.profilePic}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border text-text-secondary hover:bg-accent transition-colors"
              style={{ borderColor: '#262C36', background: 'transparent' }}
            >
              <Upload size={14} />
              {saving.profilePic ? 'Uploading...' : 'Upload Profile Picture'}
            </button>
            <p className="text-xs text-text-muted">Max 10MB, JPG/PNG/WebP</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary block mb-1">Display Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Your name..."
            />
            <button
              onClick={() => saveSetting('userName', userName)}
              disabled={saving.userName}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary flex-shrink-0 transition-opacity"
              style={{ opacity: saving.userName ? 0.6 : 1 }}
            >
              <Save size={14} />
            </button>
          </div>
        </div>
      </Section>

      {/* Banner */}
      <Section title="Dashboard Banner">
        <div className="rounded-lg overflow-hidden h-24" style={{
          background: settings.bannerImage
            ? `url(${settings.bannerImage}) center/cover`
            : 'linear-gradient(135deg, #1a1c3e, #2d1b4e, #1a3a4a)'
        }}>
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <span className="text-white text-sm">Banner Preview</span>
          </div>
        </div>

        <div>
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />
          <button
            onClick={() => bannerRef.current?.click()}
            disabled={saving.banner}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border text-text-secondary hover:bg-accent transition-colors"
            style={{ borderColor: '#262C36', background: 'transparent' }}
          >
            <Image size={14} />
            {saving.banner ? 'Uploading...' : 'Upload Banner Image'}
          </button>
          <p className="text-xs text-text-muted mt-1">Recommended: 1200x300px or wider. Max 10MB.</p>
        </div>
      </Section>

      {/* JEE Exam Date */}
      <Section title="JEE Exam Date">
        <div>
          <label className="text-sm text-text-secondary block mb-1">
            <Calendar size={14} className="inline mr-1" />
            Exam Date
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
            />
            <button
              onClick={() => saveSetting('jeeExamDate', examDate)}
              disabled={saving.jeeExamDate}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary flex-shrink-0"
              style={{ opacity: saving.jeeExamDate ? 0.6 : 1 }}
            >
              <Save size={14} />
            </button>
          </div>
        </div>
      </Section>

      {/* File System */}
      <Section title="File System">
        <div>
          <p className="text-sm text-text-secondary mb-2">
            Scan the study-content directory to discover new video and document files.
          </p>
          <button
            onClick={handleRescan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border text-text-secondary hover:bg-accent transition-colors"
            style={{ borderColor: '#262C36', background: 'transparent' }}
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Rescan All Files'}
          </button>
          <p className="text-xs text-text-muted mt-2">
            Study content path: <code className="text-primary">study-content/</code>
          </p>
        </div>
      </Section>
    </div>
  );
}
