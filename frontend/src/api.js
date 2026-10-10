/**
 * api.js - Centralized HTTP client for AdaptIQ REST API.
 * Automatically attaches JWT Bearer token and parses JSON responses.
 */

const API_BASE = '/api';

export const getStoredToken = () => localStorage.getItem('adaptiq_token');
export const setStoredToken = (token) => localStorage.setItem('adaptiq_token', token);
export const removeStoredToken = () => localStorage.removeItem('adaptiq_token');

export const getStoredUser = () => {
  try {
    const u = localStorage.getItem('adaptiq_user');
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('adaptiq_user', JSON.stringify(user));
};

export const clearStoredAuth = () => {
  removeStoredToken();
  localStorage.removeItem('adaptiq_user');
  localStorage.removeItem('adaptiq_learner');
};

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.detail || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request('/auth/me'),
  getDemoAccounts: () => request('/auth/demo-accounts'),

  // Student Endpoints
  getStudentDashboard: () => request('/student/dashboard'),
  getStudentHistory: () => request('/student/history'),

  // Quiz Endpoints
  getQuizQuestions: () => request('/quiz/questions'),
  submitQuiz: (answers) => request('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }),

  // Mentor Endpoints
  getMentorOverview: () => request('/mentor/overview'),
  getMentorStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/mentor/students${query ? `?${query}` : ''}`);
  },
  getLearnerDetails: (id) => request(`/mentor/students/${id}`),
  markLearnerReviewed: (id) => request(`/mentor/students/${id}/review`, { method: 'POST' }),
  createIntervention: (data) => request('/mentor/interventions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getFollowUps: () => request('/mentor/follow-ups'),
};
