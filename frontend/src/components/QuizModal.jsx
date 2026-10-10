import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  AlertTriangle,
  Flame,
  BookOpen,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../api';

export default function QuizModal({ isOpen, onClose, onQuizCompleted }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // {question_id: selected_answer}
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // Assessment submission result
  const [showDetailedReview, setShowDetailedReview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    } else {
      // Reset state when closed
      setQuestions([]);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setError('');
      setShowDetailedReview(false);
    }
  }, [isOpen]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getQuizQuestions();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message || 'Failed to load quiz questions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Validation: check if all answered
    const unansweredCount = questions.filter((q) => !answers[q.id]).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const data = await api.submitQuiz(answers);
      setResult(data);
      if (onQuizCompleted) {
        onQuizCompleted(data);
      }
    } catch (err) {
      setError(err.message || 'Error submitting assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const answeredTotal = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Python Skills Diagnostic</h3>
              <p className="text-xs text-slate-400">Adaptive Performance & Mastery Assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content area */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-slate-700">Loading assessment questions...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm mb-4">
                {error}
              </div>
              <button
                onClick={fetchQuestions}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : result ? (
            /* Result View */
            <div className="space-y-6 animate-fadeIn">
              {/* Score Header */}
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-100 mb-3">
                  <span className="text-2xl font-extrabold text-blue-700">
                    {result.score}%
                  </span>
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  Assessment Completed!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Correct: {result.raw_score} of {result.total_questions} questions
                  {result.score_diff !== null && (
                    <span className={`ml-2 font-semibold ${result.score_diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ({result.score_diff >= 0 ? `+${result.score_diff}%` : `${result.score_diff}%`} vs previous)
                    </span>
                  )}
                </p>
              </div>

              {/* Adaptive Decision Banner */}
              <div className={`p-5 rounded-2xl border ${
                result.decision.action === 'ADVANCE'
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : result.decision.action === 'MENTOR'
                  ? 'bg-rose-50/80 border-rose-300 text-rose-900'
                  : 'bg-amber-50/80 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                    result.decision.action === 'ADVANCE'
                      ? 'bg-emerald-600 text-white'
                      : result.decision.action === 'MENTOR'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {result.decision.action === 'ADVANCE' ? (
                      <Award className="w-5 h-5" />
                    ) : result.decision.action === 'MENTOR' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <RotateCcw className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 border">
                        Action: {result.decision.action}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 border capitalize">
                        Priority: {result.decision.priority}
                      </span>
                    </div>

                    <h5 className="font-bold text-base mt-2">
                      Recommended Next Activity:
                    </h5>
                    <p className="text-sm font-medium mt-0.5 bg-white/80 p-2.5 rounded-xl border mt-1">
                      {result.decision.next_activity}
                    </p>

                    {/* Reasons Explanations List */}
                    <div className="mt-3">
                      <span className="text-xs font-bold uppercase tracking-wide">
                        Explainable Decision Factors:
                      </span>
                      <ul className="mt-1 space-y-1">
                        {result.decision.reasons?.map((reason, idx) => (
                          <li key={idx} className="text-xs flex items-start space-x-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mt-1 flex-shrink-0"></span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Unmet Requirements if any */}
                    {result.decision.unmet_requirements?.length > 0 && (
                      <div className="mt-3 p-2.5 rounded-xl bg-rose-100/70 border border-rose-300 text-rose-800 text-xs">
                        <span className="font-bold block mb-1">Prerequisite Gate Unmet:</span>
                        <ul className="list-disc list-inside space-y-0.5">
                          {result.decision.unmet_requirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Topic Mastery Grid */}
              {result.topic_mastery && Object.keys(result.topic_mastery).length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Topic Mastery Breakdown
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(result.topic_mastery).map(([topic, mastery]) => (
                      <div
                        key={topic}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                      >
                        <div className="text-xs font-bold text-slate-700 truncate">{topic}</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mr-2 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                mastery >= 80 ? 'bg-emerald-500' : mastery >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${mastery}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-800">{mastery}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle Question Review */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  onClick={() => setShowDetailedReview(!showDetailedReview)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-1"
                >
                  <span>{showDetailedReview ? 'Hide Question Review' : 'Review Questions & Explanations'}</span>
                  {showDetailedReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showDetailedReview && (
                  <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1">
                    {result.breakdown?.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs ${
                          item.is_correct ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-slate-800">
                            Q{idx + 1}. {item.question_text}
                          </span>
                          {item.is_correct ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Correct
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                              Incorrect
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-slate-600">
                          <div>Your answer: <span className="font-semibold">{item.user_answer || '(None)'}</span></div>
                          {!item.is_correct && (
                            <div className="text-emerald-700 font-semibold mt-0.5">
                              Correct answer: {item.correct_answer}
                            </div>
                          )}
                        </div>
                        {item.explanation && (
                          <div className="mt-1.5 text-[11px] text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200/50">
                            💡 {item.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close / Retake button */}
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Quiz Questions View */
            <div>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1.5">
                  <span className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {currentQ?.topic}
                    </span>
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                  </span>
                  <span>{answeredTotal} of {questions.length} Answered</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Question Text */}
              {currentQ && (
                <div>
                  <div className="text-base font-bold text-slate-900 mb-4 leading-snug">
                    {currentQ.question_text}
                  </div>

                  {/* 4 Options */}
                  <div className="space-y-2.5 mb-6">
                    {currentQ.options?.map((opt, idx) => {
                      const isSelected = answers[currentQ.id] === opt;
                      const letters = ['A', 'B', 'C', 'D'];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(currentQ.id, opt)}
                          className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center space-x-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {letters[idx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation controls */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                        currentIndex === 0
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {currentIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 transition-colors"
                        >
                          <span>Next Question</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all"
                        >
                          {isSubmitting ? (
                            <span>Evaluating with AI...</span>
                          ) : (
                            <>
                              <span>Submit Assessment</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
