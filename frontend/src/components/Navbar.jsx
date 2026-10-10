import React from 'react';
import { GraduationCap, Users, LogOut, Sparkles, BookOpen, UserCheck } from 'lucide-react';

export default function Navbar({ user, learner, activeTab, setActiveTab, onLogout }) {
  const isStudent = user?.role === 'student';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                  AdaptIQ
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Coach AI
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Adaptive Learning Intelligence</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {isStudent ? (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'quiz'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Take Assessment
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Learning History
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Mentor Overview
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'students'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Student Directory
                </button>
                <button
                  onClick={() => setActiveTab('followups')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'followups'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Intervention Records
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 pl-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                isStudent ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {isStudent ? <GraduationCap className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className={`inline-block w-2 h-2 rounded-full ${isStudent ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                  <span className="capitalize text-slate-500 font-medium">
                    {user?.role} {learner?.current_level ? `• Lvl ${learner.current_level}` : ''}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Log Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
