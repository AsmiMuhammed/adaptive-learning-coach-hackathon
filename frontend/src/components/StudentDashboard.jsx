import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  PlayCircle,
  Clock,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../api';
import QuizModal from './QuizModal';

export default function StudentDashboard({ user, learner, onProfileUpdated }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getStudentDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to load student dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizCompleted = (result) => {
    // Refresh dashboard to pull the new quiz attempt and decision
    fetchDashboard();
    if (onProfileUpdated) {
      onProfileUpdated();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Loading personalized student dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <p className="font-bold">Error loading dashboard</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profile = dashboardData?.profile || learner;
  const latestAssessment = dashboardData?.latest_assessment;
  const latestDecision = dashboardData?.latest_decision;
  const chartData = dashboardData?.chart_data || [];
  const recentHistory = dashboardData?.recent_history || [];
  const scoreChange = dashboardData?.score_change;

  const lessonsCompleted = profile?.lessons_completed || 0;
  const lessonsTotal = profile?.lessons_total || 10;
  const lessonsRemaining = Math.max(lessonsTotal - lessonsCompleted, 0);
  const progressPercent = Math.round((lessonsCompleted / lessonsTotal) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* 1. Profile & Quick Stats Header (Section 5A) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-blue-500/25 flex-shrink-0">
              <GraduationCap className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {profile?.name || user?.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Level {profile?.current_level || 1}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Student ID: <span className="font-mono text-slate-700">{profile?.student_id}</span> • Track: <span className="text-slate-800 font-semibold">{profile?.course}</span>
              </p>
              <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center text-amber-600">
                  <Flame className="w-4 h-4 mr-1 fill-amber-500" />
                  {profile?.streak_days || 1} Day Streak
                </span>
                <span>•</span>
                <span>
                  {profile?.prerequisites_completed ? (
                    <span className="text-emerald-600 font-semibold">✓ Prereqs Verified</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">⚠ Prereqs Incomplete</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Start Quiz Action CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsQuizOpen(true)}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Start Adaptive Assessment</span>
            </button>
          </div>
        </div>

        {/* Course Progress Bar */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Overall Learning Progress</span>
              </span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>{lessonsCompleted} of {lessonsTotal} Lessons Completed</span>
              <span>{lessonsRemaining} Lessons Remaining</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-around p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-center">
              <div className="text-xl font-extrabold text-slate-900">{lessonsCompleted}</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Completed</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center">
              <div className="text-xl font-extrabold text-slate-900">{lessonsRemaining}</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Remaining</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center">
              <div className="text-xl font-extrabold text-blue-600">{profile?.current_level || 1}</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Current Lvl</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Latest Assessment Result & Adaptive Action (Section 5D & 5E) */}
      {latestDecision ? (
        <div className={`rounded-3xl border p-6 sm:p-8 shadow-sm transition-all ${
          latestDecision.action === 'ADVANCE'
            ? 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white border-emerald-300'
            : latestDecision.action === 'MENTOR'
            ? 'bg-gradient-to-br from-rose-50/90 via-rose-50/40 to-white border-rose-300'
            : 'bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border-amber-300'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              {/* Badge & Action Header */}
              <div className="flex items-center space-x-2.5 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  latestDecision.action === 'ADVANCE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : latestDecision.action === 'MENTOR'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-amber-500 text-white shadow-sm'
                }`}>
                  Coach Action: {latestDecision.action}
                </span>

                <span className="text-xs px-2.5 py-1 rounded-full bg-white/80 font-bold border border-slate-200 text-slate-700 capitalize">
                  Priority: {latestDecision.priority}
                </span>

                {latestAssessment && (
                  <span className="text-xs text-slate-500 font-medium">
                    Assessed on {new Date(latestAssessment.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Title & Next Activity */}
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                {latestDecision.action === 'ADVANCE'
                  ? 'Outstanding Progress! Advancement Ready'
                  : latestDecision.action === 'MENTOR'
                  ? 'Mentor Support Recommended for Core Topics'
                  : 'Targeted Concept Reinforcement Assigned'}
              </h2>

              <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/80 shadow-sm mt-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                  <span>Personalized Next Step</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {latestDecision.next_activity}
                </p>
              </div>

              {/* Explainable Decision Factors */}
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Explainable Decision Factors:
                </div>
                <div className="space-y-1.5">
                  {latestDecision.reasons?.map((reason, idx) => (
                    <div key={idx} className="text-xs text-slate-700 flex items-start space-x-2 bg-white/60 p-2 rounded-xl border border-slate-200/50">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unmet requirements alert (if applicable) */}
              {latestDecision.unmet_requirements?.length > 0 && (
                <div className="mt-4 p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs">
                  <span className="font-bold block mb-1">Prerequisite Gate Notice:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {latestDecision.unmet_requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Score pill & Trend */}
            <div className="lg:w-64 bg-white/90 rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Latest Score
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {latestAssessment ? `${latestAssessment.score}%` : 'N/A'}
                  </span>
                  {scoreChange !== null && scoreChange !== undefined && (
                    <span className={`text-xs font-bold ${scoreChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {scoreChange >= 0 ? `+${scoreChange}%` : `${scoreChange}%`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Topic Mastery: <strong className="text-slate-800">{latestDecision.mastery}%</strong>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsQuizOpen(true)}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors text-center"
                >
                  Take Next Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state: No assessment taken yet */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Assessment History Yet</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            Take your first 5-question Python skill assessment so our adaptive engine can evaluate your mastery and tailor your path.
          </p>
          <button
            onClick={() => setIsQuizOpen(true)}
            className="mt-5 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 inline-flex items-center space-x-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span>Take Diagnostic Quiz Now</span>
          </button>
        </div>
      )}

      {/* 3. Progress Visualization & Historical Scores Chart (Section 5F) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Assessment Performance History</span>
              </h3>
              <p className="text-xs text-slate-500">Track your score trajectory over historical attempts</p>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <TrendingUp className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs font-semibold">Insufficient score data to render trajectory</p>
              <p className="text-[11px] text-slate-400 mt-1">Complete your first quiz to begin tracking performance</p>
            </div>
          )}
        </div>

        {/* Learning History Summary (Section 5B) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Recent Activities</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Past quizzes and verified attempts</p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {recentHistory.length > 0 ? (
              recentHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        Python Fundamentals Quiz
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.formatted_date}
                      </div>
                    </div>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      item.score >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.score >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.score}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No quiz history on record.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onQuizCompleted={handleQuizCompleted}
      />
    </div>
  );
}
