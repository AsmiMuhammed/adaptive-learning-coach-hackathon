import React, { useState, useEffect } from 'react';
import {
  api,
  getStoredToken,
  setStoredToken,
  setStoredUser,
  clearStoredAuth,
} from './api';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/StudentDashboard';
import MentorDashboard from './components/MentorDashboard';
import QuizModal from './components/QuizModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLearner, setCurrentLearner] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTakeQuizModalOpen, setIsTakeQuizModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setCurrentUser(data.user);
      setCurrentLearner(data.learner);
      setActiveTab(data.user.role === 'student' ? 'dashboard' : 'overview');
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      clearStoredAuth();
      setCurrentUser(null);
      setCurrentLearner(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLoginSuccess = async (email, password) => {
    const data = await api.login(email, password);
    setStoredToken(data.token);
    setStoredUser(data.user);
    setCurrentUser(data.user);
    setCurrentLearner(data.learner);

    if (data.user.role === 'student') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('overview');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout errors
    }
    clearStoredAuth();
    setCurrentUser(null);
    setCurrentLearner(null);
    setActiveTab('dashboard');
  };

  const refreshProfile = async () => {
    try {
      const data = await api.getCurrentUser();
      setCurrentLearner(data.learner);
    } catch (e) {}
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">Initializing AdaptIQ...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar
        user={currentUser}
        learner={currentLearner}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'quiz') {
            setIsTakeQuizModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1 pb-16">
        {currentUser.role === 'student' ? (
          <StudentDashboard
            user={currentUser}
            learner={currentLearner}
            onProfileUpdated={refreshProfile}
          />
        ) : (
          <MentorDashboard user={currentUser} />
        )}
      </main>

      {/* Global Take Quiz Modal if opened from Navbar */}
      <QuizModal
        isOpen={isTakeQuizModalOpen}
        onClose={() => setIsTakeQuizModalOpen(false)}
        onQuizCompleted={() => {
          refreshProfile();
        }}
      />
    </div>
  );
}
