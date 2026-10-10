import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Award,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Flame,
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

export default function LearnerDetailModal({ learner, onClose, onLearnerUpdated }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'intervene' | 'history'
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('completed');
  const [actionType, setActionType] = useState('1-on-1 Check-in');
  const [outcome, setOutcome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!learner) return null;

  const handleMarkReviewed = async () => {
    try {
      await api.markLearnerReviewed(learner.id);
      setSuccessMessage('Learner marked as reviewed.');
      if (onLearnerUpdated) onLearnerUpdated();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update review status.');
    }
  };

  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.createIntervention({
        learner_id: learner.id,
        note,
        status,
        action_type: actionType,
        outcome: outcome || undefined,
      });

      setSuccessMessage('Intervention note recorded successfully.');
      setNote('');
      setOutcome('');
      if (onLearnerUpdated) onLearnerUpdated();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record intervention.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const explainable = learner.explainable_ai;
  const chartData = learner.score_chart_data || [];
  const interventions = learner.interventions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold">{learner.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-900 border border-indigo-700 text-indigo-200 font-mono">
                  {learner.student_id}
                </span>
                {learner.reviewed_by_mentor ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-700 text-emerald-300 font-semibold">
                    ✓ Reviewed
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-900/80 border border-amber-700 text-amber-300 font-semibold">
                    Needs Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {learner.email} • Track: {learner.course} • Level {learner.current_level}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!learner.reviewed_by_mentor && (
              <button
                onClick={handleMarkReviewed}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Mark Reviewed
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-100/80 px-6 py-2.5 border-b border-slate-200 flex space-x-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Explainable AI
          </button>
          <button
            onClick={() => setActiveTab('intervene')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'intervene'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Record Intervention ({interventions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quiz Assessment History ({learner.quiz_history?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage('')}>✕</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')}>✕</button>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Quick Status Pill Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Latest Score</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {learner.latest_quiz_score !== null ? `${learner.latest_quiz_score}%` : 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Failed Attempts</span>
                  <div className={`text-2xl font-extrabold mt-0.5 ${
                    learner.failed_attempts_count >= 2 ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {learner.failed_attempts_count}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Last Active</span>
                  <div className={`text-2xl font-extrabold mt-0.5 ${
                    learner.days_since_last_activity >= 14 ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {learner.days_since_last_activity}d ago
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Prerequisites</span>
                  <div className="text-base font-bold text-slate-900 mt-2">
                    {learner.prerequisites_completed ? (
                      <span className="text-emerald-600">✓ Satisfied</span>
                    ) : (
                      <span className="text-rose-600">⚠ Incomplete</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Explainable AI Decision Box (Section 6E) */}
              {explainable ? (
                <div className={`rounded-2xl border p-5 ${
                  explainable.action === 'ADVANCE'
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : explainable.action === 'MENTOR'
                    ? 'bg-rose-50/80 border-rose-300'
                    : 'bg-amber-50/80 border-amber-300'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full text-white ${
                        explainable.action === 'ADVANCE'
                          ? 'bg-emerald-600'
                          : explainable.action === 'MENTOR'
                          ? 'bg-rose-600'
                          : 'bg-amber-500'
                      }`}>
                        Decision: {explainable.action}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white font-bold border border-slate-200 capitalize">
                        Priority: {explainable.priority}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-slate-600">
                      Estimated Mastery: <strong>{explainable.mastery}%</strong>
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 mb-3">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Recommended Learning Activity:
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {explainable.next_activity}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                      Multi-Factor Explanations:
                    </span>
                    <ul className="space-y-1">
                      {explainable.reasons?.map((reason, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start space-x-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mt-1 flex-shrink-0"></span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {explainable.unmet_requirements?.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs">
                      <span className="font-bold">Missing Prerequisites / Requirements:</span>
                      <ul className="list-disc list-inside mt-0.5">
                        {explainable.unmet_requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  No adaptive decision recorded yet. Student has not submitted an assessment.
                </div>
              )}

              {/* Score Trend Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Student Score Progression Trend</span>
                </h4>
                {chartData.length > 0 ? (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} unit="%" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }}
                          formatter={(v) => [`${v}%`, 'Score']}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          dot={{ fill: '#4f46e5', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No historical quiz attempts available.
                  </div>
                )}
              </div>

              {/* Weak & Strong Topics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                    Identified Weak Topics (&lt;70%)
                  </h5>
                  {learner.weak_topics?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {learner.weak_topics.map((t, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">None detected. Good grasp across assessed topics.</span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                    Identified Strong Topics (≥80%)
                  </h5>
                  {learner.strong_topics?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {learner.strong_topics.map((t, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No topics marked as advanced mastery yet.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intervene' && (
            <div className="space-y-6">
              {/* Form to Record Intervention (Section 6D) */}
              <form onSubmit={handleCreateIntervention} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Log Mentor Intervention / Check-in</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Action Type
                    </label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1-on-1 Check-in">1-on-1 Check-in</option>
                      <option value="Targeted Tutoring">Targeted Tutoring</option>
                      <option value="Study Plan Revision">Study Plan Revision</option>
                      <option value="Prerequisite Diagnostic">Prerequisite Diagnostic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending">Pending Follow-up</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Intervention Note & Feedback
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe notes from the meeting, guidance provided, or action plan agreed upon..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Outcome / Next Steps (Optional)
                  </label>
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="e.g. Student committed to completing 3 loops drills before re-quiz"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Intervention Record'}</span>
                  </button>
                </div>
              </form>

              {/* Past Interventions List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Intervention History ({interventions.length})
                </h4>
                {interventions.length > 0 ? (
                  <div className="space-y-3">
                    {interventions.map((inv) => (
                      <div key={inv.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-indigo-700">{inv.action_type}</span>
                            <span className="text-xs text-slate-400 ml-2">by {inv.mentor_name}</span>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            inv.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{inv.note}</p>
                        {inv.outcome && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <strong>Outcome:</strong> {inv.outcome}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {new Date(inv.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No prior mentor interventions recorded for this student.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detailed Assessment Submissions
              </h4>
              {learner.quiz_history?.length > 0 ? (
                learner.quiz_history.map((attempt) => (
                  <div key={attempt.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Python Assessment
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {new Date(attempt.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <span className={`text-sm font-extrabold px-3 py-1 rounded-full ${
                        attempt.score >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : attempt.score >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {attempt.score}%
                      </span>
                    </div>

                    {attempt.topic_scores && Object.keys(attempt.topic_scores).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                        {Object.entries(attempt.topic_scores).map(([topic, score]) => (
                          <span key={topic} className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium">
                            {topic}: <strong>{score}%</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No quizzes on record.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
