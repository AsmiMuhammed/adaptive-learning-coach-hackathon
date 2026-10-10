import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  RotateCcw,
  Award,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Sparkles,
  BookOpen,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api';
import LearnerDetailModal from './LearnerDetailModal';

export default function MentorDashboard({ user }) {
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'mentor' | 'reinforce' | 'advance' | 'inactive' | 'unreviewed'
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'score' | 'name' | 'activity'
  const [viewTab, setViewTab] = useState('directory'); // 'directory' | 'followups'

  useEffect(() => {
    fetchData();
  }, [statusFilter, sortBy]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [overviewData, studentsData, followUpsData] = await Promise.all([
        api.getMentorOverview(),
        api.getMentorStudents({
          search: searchQuery,
          filter: statusFilter,
          sort: sortBy,
        }),
        api.getFollowUps(),
      ]);

      setOverview(overviewData);
      setStudents(studentsData.students || []);
      setFollowUps(followUpsData.interventions || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch mentor cohort data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleSelectStudent = async (studentId) => {
    try {
      const details = await api.getLearnerDetails(studentId);
      setSelectedLearner(details);
    } catch (err) {
      alert('Could not fetch student details: ' + err.message);
    }
  };

  const handleLearnerUpdated = async () => {
    fetchData();
    if (selectedLearner) {
      try {
        const details = await api.getLearnerDetails(selectedLearner.id);
        setSelectedLearner(details);
      } catch (e) {}
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Mentor Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Mentor Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Live Cohort Monitoring & AI Diagnostics
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            Student Monitoring & Intervention Hub
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section 6A: Dynamic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Cohort</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {overview?.total_students || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Enrolled Learners</div>
        </div>

        {/* Card 2: Requires Mentor */}
        <div className={`rounded-2xl border p-5 shadow-sm ${
          (overview?.students_requiring_mentor || 0) > 0
            ? 'bg-rose-50/70 border-rose-200'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Needs Mentor</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600">
            {overview?.students_requiring_mentor || 0}
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-semibold">Priority Interventions</div>
        </div>

        {/* Card 3: Recommended Reinforce */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reinforce</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {overview?.students_recommended_reinforce || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Practice Assigned</div>
        </div>

        {/* Card 4: Ready to Advance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Advancing</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {overview?.students_ready_advance || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for Level Up</div>
        </div>

        {/* Card 5: Cohort Avg Score */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Score</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {overview?.average_latest_score || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {overview?.assessed_students_count || 0} Assessed
          </div>
        </div>
      </div>

      {/* Directory vs Follow-ups View Toggle */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setViewTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Student Directory ({students.length})
        </button>
        <button
          onClick={() => setViewTab('followups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            viewTab === 'followups'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Mentor Follow-up Log ({followUps.length})
        </button>
      </div>

      {viewTab === 'directory' ? (
        /* Section 6B: Student Directory */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Search & Filters Bar */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, email, or ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Students' },
                { id: 'mentor', label: 'Requires Mentor' },
                { id: 'reinforce', label: 'Reinforce' },
                { id: 'advance', label: 'Advance' },
                { id: 'inactive', label: 'Inactive (>14d)' },
                { id: 'unreviewed', label: 'Needs Review' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === f.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="priority">Attention Priority</option>
                <option value="score">Latest Score</option>
                <option value="name">Student Name</option>
                <option value="activity">Inactivity Days</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Level / Progress</th>
                  <th className="py-3.5 px-4">Latest Score</th>
                  <th className="py-3.5 px-4">Activity</th>
                  <th className="py-3.5 px-4">Adaptive Action</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p>Loading student directory...</p>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No students found matching current filters.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => handleSelectStudent(student.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {student.student_id} • {student.email}
                        </div>
                      </td>

                      {/* Level & Progress */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">Level {student.current_level}</div>
                        <div className="text-[11px] text-slate-400">
                          {student.lessons_completed}/{student.lessons_total} lessons ({student.progress_percentage}%)
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4">
                        {student.latest_quiz_score !== null ? (
                          <div className="flex items-center space-x-1.5">
                            <span className={`font-extrabold px-2 py-0.5 rounded-full text-xs ${
                              student.latest_quiz_score >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : student.latest_quiz_score >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {student.latest_quiz_score}%
                            </span>
                            {student.failed_attempts_count > 0 && (
                              <span className="text-[10px] text-rose-600 font-bold" title="Failed attempts">
                                ({student.failed_attempts_count} fails)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Activity */}
                      <td className="py-3.5 px-4">
                        <span className={`font-medium ${
                          student.days_since_last_activity >= 14
                            ? 'text-rose-600 font-bold'
                            : student.days_since_last_activity >= 7
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}>
                          {student.days_since_last_activity === 0
                            ? 'Today'
                            : `${student.days_since_last_activity}d ago`}
                        </span>
                      </td>

                      {/* Adaptive Action */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          student.latest_action === 'ADVANCE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : student.latest_action === 'MENTOR'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : student.latest_action === 'REINFORCE'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {student.latest_action}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span className={`capitalize font-bold ${
                          student.latest_priority === 'high'
                            ? 'text-rose-600'
                            : student.latest_priority === 'medium'
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}>
                          {student.latest_priority}
                        </span>
                      </td>

                      {/* Review status */}
                      <td className="py-3.5 px-4">
                        {student.reviewed_by_mentor ? (
                          <span className="inline-flex items-center text-emerald-600 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Reviewed
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-600 font-semibold text-[11px]">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudent(student.id);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[11px] font-bold shadow-sm transition-colors inline-flex items-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Follow-ups view */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span>Complete Mentor Intervention & Follow-up Log</span>
          </h3>

          <div className="space-y-3">
            {followUps.length > 0 ? (
              followUps.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-indigo-800">{inv.action_type}</span>
                      <span className="text-xs text-slate-500 ml-2">Recorded by {inv.mentor_name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      inv.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{inv.note}</p>
                  {inv.outcome && (
                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                      <strong>Outcome:</strong> {inv.outcome}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">
                    {new Date(inv.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No mentor interventions on record yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Individual Learner Details Modal */}
      {selectedLearner && (
        <LearnerDetailModal
          learner={selectedLearner}
          onClose={() => setSelectedLearner(null)}
          onLearnerUpdated={handleLearnerUpdated}
        />
      )}
    </div>
  );
}
