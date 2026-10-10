import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(null); // 'student' or 'mentor'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenLogin = (role, defaultEmail = '') => {
    setSelectedRole(role);
    setEmail(defaultEmail || (role === 'student' ? 'student1@demo.com' : 'mentor@demo.com'));
    setPassword('password123');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      await onLoginSuccess(email, password);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (targetEmail, targetRole) => {
    setSelectedRole(targetRole);
    setEmail(targetEmail);
    setPassword('password123');
    setIsLoading(true);
    setErrorMessage('');
    try {
      await onLoginSuccess(targetEmail, 'password123');
    } catch (err) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-indigo-50/20 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      {/* Top Banner / Navigation */}
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
              AdaptIQ
            </span>
            <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Problem #8 Hackathon
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Explainable AI Engine • SQLite Persistent Storage</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl mx-auto text-center mt-2 mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
          <BrainCircuit className="w-4 h-4" />
          <span>Autonomous Learning Path Recommendation Engine</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          AdaptIQ — <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Adaptive Learning Coach</span>
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto">
          "Every learner is different. Every learning path should be too."
        </p>
      </div>

      {/* Main Login Role Cards (Section 3 Requirement) */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Student Login Card */}
        <div className="bg-white rounded-2xl border-2 border-slate-200/80 p-8 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-200 flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
              Student Portal
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm mb-6">
              Take assessments, track your topic mastery in real time, and receive personalized learning recommendations (Reinforce, Advance, or Mentor support).
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                Adaptive 5-question Python skill assessment
              </div>
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                Explainable reasoning behind every decision
              </div>
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                Prerequisite validation & progression tracking
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenLogin('student', 'student1@demo.com')}
            className="w-full py-3.5 px-5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 transition-colors"
          >
            <span>Login as Student</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mentor Login Card */}
        <div className="bg-white rounded-2xl border-2 border-slate-200/80 p-8 shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all duration-200 flex flex-col justify-between group">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 flex items-center">
              Mentor Portal
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm mb-6">
              Monitor student performance, review learning patterns, identify learners in need of attention, and provide timely 1-on-1 interventions.
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" />
                Live cohort overview & intervention flags
              </div>
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" />
                Deep drill-down into weak & strong topics
              </div>
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" />
                Action logging, follow-up notes, and review history
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenLogin('mentor', 'mentor@demo.com')}
            className="w-full py-3.5 px-5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-colors"
          >
            <span>Login as Mentor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Demo Credentials & Quick Test Bench (Section 4 Requirement) */}
      <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Demo Accounts & Evaluation Test Bench</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                1-Click Sign In
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Default password for all demo accounts: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700">password123</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-left">
          {/* Persona 1: Active demo student */}
          <button
            onClick={() => quickLogin('student1@demo.com', 'student')}
            className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900">Alex Rivera</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Student</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">student1@demo.com</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1">Active (Score ~75%)</div>
          </button>

          {/* Persona 2: Mentor */}
          <button
            onClick={() => quickLogin('mentor@demo.com', 'mentor')}
            className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900">Dr. Evelyn Vance</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">Mentor</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">mentor@demo.com</div>
            <div className="text-[10px] text-indigo-600 font-medium mt-1">Full Cohort Monitor</div>
          </button>

          {/* Persona 3: Scenario B - Advance */}
          <button
            onClick={() => quickLogin('student2@demo.com', 'student')}
            className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900">Maya Lin</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Advance</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">student2@demo.com</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1">Score 95% • Level 2</div>
          </button>

          {/* Persona 4: Scenario C - Struggling / Mentor */}
          <button
            onClick={() => quickLogin('student4@demo.com', 'student')}
            className="p-3 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900">Carlos Gomez</span>
              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">Needs Mentor</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">student4@demo.com</div>
            <div className="text-[10px] text-rose-600 font-medium mt-1">3 Failed Attempts (45%)</div>
          </button>
        </div>
      </div>

      {/* Login Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3 ${
                selectedRole === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {selectedRole === 'student' ? <GraduationCap className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 capitalize">
                {selectedRole} Login
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to access the AdaptIQ {selectedRole} platform
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@demo.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md flex items-center justify-center space-x-2 ${
                  selectedRole === 'student'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
                }`}
              >
                {isLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail(selectedRole === 'student' ? 'student1@demo.com' : 'mentor@demo.com');
                  setPassword('password123');
                }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Autofill default {selectedRole} demo credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400 mt-6 border-t border-slate-200/60 pt-4">
        AdaptIQ — AI-Powered Adaptive Learning Coach • Hackathon Problem #8 • Built with Flask, SQLite, React & Vite
      </footer>
    </div>
  );
}
