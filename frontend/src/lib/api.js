import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const message = err.response?.data?.error || err.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Subjects
export const getSubjects = () => api.get('/subjects');
export const getSubjectChapters = (subject) => api.get(`/subjects/${subject}/chapters`);
export const scanSubject = (subject) => api.post(`/subjects/${subject}/scan`);

// Chapters
export const getChapter = (id) => api.get(`/chapters/${id}`);
export const updateChapter = (id, data) => api.put(`/chapters/${id}`, data);
export const reorderChapters = (subject, items) => api.post(`/chapters/${subject}/reorder`, { items });
export const getChapterItems = (id) => api.get(`/chapters/${id}/items`);
export const addYoutubeVideo = (id, data) => api.post(`/chapters/${id}/items/youtube`, data);
export const reorderItems = (id, items) => api.post(`/chapters/${id}/items/reorder`, { items });

// Items
export const getItem = (id) => api.get(`/items/${id}`);
export const updateProgress = (id, data) => api.put(`/items/${id}/progress`, data);
export const toggleComplete = (id, completed) => api.put(`/items/${id}/complete`, { completed });
export const recordAccess = (id) => api.put(`/items/${id}/access`);

// Analytics
export const getAnalytics = () => api.get('/analytics');
export const getHeatmap = () => api.get('/analytics/heatmap');
export const getRecentActivity = () => api.get('/analytics/recent');

// Weekly Plan
export const getWeeklyPlan = () => api.get('/weekly-plan');
export const getWeekPlan = (weekStart) => api.get(`/weekly-plan/${weekStart}`);
export const saveWeekPlan = (weekStart, plans) => api.put(`/weekly-plan/${weekStart}`, { plans });
export const estimateTime = (data) => api.post('/weekly-plan/estimate', data);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSetting = (key, value) => api.put(`/settings/${key}`, { value });
export const uploadProfilePic = (formData) => api.post('/settings/profile-pic', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const uploadBanner = (formData) => api.post('/settings/banner', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const rescanAll = () => api.post('/settings/rescan');

export default api;
