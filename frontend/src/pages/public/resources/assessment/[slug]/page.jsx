import { gooeyToast } from 'goey-toast';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
    Clock, ChevronLeft, ChevronRight, Check, AlertTriangle,
    Send, Loader2, Home, RotateCcw, Flag
} from 'lucide-react';
import { SEOHead } from '@/components/common';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';
import SmartImage from '@/components/common/SmartImage';

// ============================================
// QUIZ PAGE - Test Taking Interface
// ============================================

// Timer Component - Stable implementation using refs
const Timer = ({ startTime, durationSeconds, onTimeUp, isPaused }) => {
    // Calculate initial time left based on server start time
    const getInitialTimeLeft = () => {
        if (!startTime) return durationSeconds;
        const start = new Date(startTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        return Math.max(0, durationSeconds - elapsed);
    };

    const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft);
    const timeLeftRef = React.useRef(timeLeft);
    const onTimeUpRef = React.useRef(onTimeUp);

    // Keep refs updated
    React.useEffect(() => {
        timeLeftRef.current = timeLeft;
    }, [timeLeft]);

    React.useEffect(() => {
        onTimeUpRef.current = onTimeUp;
    }, [onTimeUp]);

    // Timer tick - runs once and doesn't depend on changing values
    React.useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const next = prev - 1;
                if (next <= 0) {
                    clearInterval(timer);
                    onTimeUpRef.current?.();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPaused]); // Only depend on isPaused

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isLow = timeLeft < 60;
    const isCritical = timeLeft < 30;

    return (
        <div className={`flex items-center gap-2 px-4 py-2 font-mono text-lg font-bold transition-colors
                        ${isCritical ? 'bg-red-100 text-red-600 animate-pulse' :
                isLow ? 'bg-orange-100 text-orange-600' :
                    'bg-neutral-100 text-neutral-700'}`}>
            <Clock className="w-5 h-5" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
    );
};


// Progress Bar
const ProgressBar = ({ current, total }) => {
    const percentage = Math.round((current / total) * 100);

    return (
        <div className="flex-1">
            <div className="flex items-center justify-between text-sm text-neutral-500 mb-1">
                <span>Câu {current}/{total}</span>
                <span>{percentage}%</span>
            </div>
            <div className="h-2 bg-neutral-100 overflow-hidden">
                <div
                    className="h-full bg-[#FF4D00] transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

// Question Navigator (Sidebar Grid)
const QuestionNavigator = ({ questions, answers, currentIndex, onNavigate }) => {
    return (
        <div className="hidden xl:block w-64 bg-neutral-50 border-l border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                Điều hướng câu hỏi
            </h3>
            <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = i === currentIndex;

                    return (
                        <button
                            key={q.id}
                            onClick={() => onNavigate(i)}
                            className={`w-10 h-10 flex items-center justify-center text-sm font-medium
                                      transition-all duration-150
                                      ${isCurrent
                                    ? 'bg-[#FF4D00] text-white'
                                    : isAnswered
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400'}`}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2 text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500" />
                    <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#FF4D00]" />
                    <span>Câu hiện tại</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-neutral-200 bg-white" />
                    <span>Chưa trả lời</span>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
                <div className="text-sm text-neutral-600">
                    Đã trả lời: <span className="font-semibold text-emerald-600">
                        {Object.keys(answers).length}/{questions.length}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Answer Option Component
const AnswerOption = ({ label, text, isSelected, onClick, disabled }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full p-4 text-left border-2 transition-all duration-200
                      ${isSelected
                    ? 'border-[#FF4D00] bg-[#FF4D00]/5'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white'}
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className="flex items-start gap-4">
                <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-bold
                                ${isSelected
                        ? 'bg-[#FF4D00] text-white'
                        : 'bg-neutral-100 text-neutral-600'}`}>
                    {label}
                </span>
                <span className="text-neutral-800 leading-relaxed">{text}</span>
            </div>
        </button>
    );
};

// Question Card
const QuestionCard = ({ question, selectedAnswer, onAnswer }) => {
    const options = question.options || [];
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
        <div className="flex-1 p-6 lg:p-12 overflow-y-auto">
            {/* Question Text */}
            <div className="max-w-3xl mx-auto">
                <div className="mb-2 flex items-center gap-2">
                    {question.skill_area && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium uppercase">
                            {question.skill_area}
                        </span>
                    )}
                    {question.difficulty && (
                        <span className={`px-2 py-1 text-xs font-medium uppercase
                            ${question.difficulty <= 2 ? 'bg-emerald-50 text-emerald-600' :
                                question.difficulty <= 3 ? 'bg-yellow-50 text-yellow-600' :
                                    'bg-red-50 text-red-600'}`}>
                            {question.difficulty <= 2 ? 'Dễ' : question.difficulty <= 3 ? 'Trung bình' : 'Khó'}
                        </span>
                    )}
                </div>

                <h2 className="text-xl lg:text-2xl font-medium text-neutral-900 mb-8 leading-relaxed">
                    {question.question_text}
                </h2>

                {/* Media if present */}
                {question.media_url && (
                    <div className="mb-8">
                        {question.media_url.includes('audio') ? (
                            <audio controls src={question.media_url} className="w-full" />
                        ) : (
                            <SmartImage
                                src={question.media_url}
                                alt="Question media"
                                className="max-w-full h-auto rounded border border-neutral-200"
                            />
                        )}
                    </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                    {options.map((option, i) => (
                        <AnswerOption
                            key={i}
                            label={labels[i]}
                            text={option}
                            isSelected={selectedAnswer === option}
                            onClick={() => onAnswer(option)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Pre-test Form for Guests
const GuestForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên';
        if (!form.email.trim()) errs.email = 'Vui lòng nhập email';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email không hợp lệ';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) onSubmit(form);
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border-2 border-neutral-200 p-8">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Thông tin của bạn
                </h2>
                <p className="text-neutral-500 mb-6">
                    Điền thông tin để nhận kết quả qua email
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Họ và tên *
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={`w-full px-4 py-3 border-2 transition-colors
                                      ${errors.name ? 'border-red-300' : 'border-neutral-200'}
                                      focus:border-neutral-900 focus:outline-none`}
                            placeholder="Nguyễn Văn A"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={`w-full px-4 py-3 border-2 transition-colors
                                      ${errors.email ? 'border-red-300' : 'border-neutral-200'}
                                      focus:border-neutral-900 focus:outline-none`}
                            placeholder="email@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-neutral-200
                                     focus:border-neutral-900 focus:outline-none transition-colors"
                            placeholder="0912 345 678"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-neutral-900 text-white font-semibold uppercase tracking-wider
                                 hover:bg-[#FF4D00] transition-colors disabled:opacity-50 flex items-center 
                                 justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Bắt đầu làm bài
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-xs text-neutral-400 text-center mt-6">
                    Bằng việc tiếp tục, bạn đồng ý với{' '}
                    <Link to="/dieu-khoan" className="underline hover:text-neutral-200 transition-colors">điều khoản sử dụng</Link>
                    {' '}và{' '}
                    <Link to="/bao-mat" className="underline hover:text-neutral-200 transition-colors">chính sách bảo mật</Link>
                    {' '}của chúng tôi.
                </p>
            </div>
        </div>
    );
};

// Submit Confirmation Modal
const SubmitModal = ({ isOpen, onClose, onConfirm, unansweredCount, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    Xác nhận nộp bài
                </h3>

                {unansweredCount > 0 ? (
                    <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 mb-6">
                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-orange-700">
                            Bạn còn <strong>{unansweredCount} câu chưa trả lời</strong>.
                            Bạn có chắc chắn muốn nộp bài không?
                        </p>
                    </div>
                ) : (
                    <p className="text-neutral-600 mb-6">
                        Bạn đã trả lời tất cả các câu hỏi. Nhấn "Nộp bài" để xem kết quả.
                    </p>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-3 border-2 border-neutral-200 text-neutral-700 font-medium
                                 hover:bg-neutral-50 transition-colors"
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-3 bg-[#FF4D00] text-white font-medium
                                 hover:bg-[#E64500] transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Nộp bài
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// MAIN QUIZ PAGE
// ============================================
export const QuizPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    // State
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [attempt, setAttempt] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeSpent, setTimeSpent] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [needsGuestInfo, setNeedsGuestInfo] = useState(false);
    const [guestInfo, setGuestInfo] = useState(null);

    // Current question
    const currentQuestion = questions[currentIndex];
    const unansweredCount = questions.length - Object.keys(answers).length;

    // Fetch test data - simplified since RPC handles everything
    useEffect(() => {
        const initializeQuiz = async () => {
            // Prevent re-fetching if attempt is already initialized
            if (attempt && questions.length > 0) return;

            // Check if user is logged in
            if (!user) {
                // Show guest form for non-logged in users
                setNeedsGuestInfo(true);
                setLoading(false);
            } else {
                // For logged in users, start/check attempt automatically
                await startAttempt(user.id);
            }
        };

        initializeQuiz();
    }, [slug, user]); // Simplified dependencies

    // Start attempt function - OPTIMIZED: Single RPC call returns everything
    const startAttempt = async (userId = null, guest = null) => {
        try {
            setLoading(true);

            // Single optimized RPC call that returns test, attempt, and questions
            const { data, error } = await supabase
                .rpc('start_assessment_with_questions', {
                    p_test_slug: slug,
                    p_user_id: userId,
                    p_guest_email: guest?.email || null,
                    p_guest_name: guest?.name || null,
                    p_guest_phone: guest?.phone || null,
                });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // Set all data from single response
            setTest(data.test);
            setAttempt(data.attempt);

            // Sort questions by order
            const questionsOrder = data.questions_order || [];
            const sortedQuestions = questionsOrder.map(id =>
                data.questions.find(q => q.id === id)
            ).filter(Boolean);

            setQuestions(sortedQuestions);
            setNeedsGuestInfo(false);
        } catch (err) {
            console.error('Error starting attempt:', err);
            gooeyToast(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Handle guest form submit
    const handleGuestSubmit = async (form) => {
        setGuestInfo(form);
        await startAttempt(null, form); // No userId for guests, pass guest form
    };

    // Track tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && attempt) {
                setTabSwitches(prev => prev + 1);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [attempt]);

    // Track time spent accurately based on start time
    useEffect(() => {
        if (!attempt?.started_at) return;

        const timer = setInterval(() => {
            const start = new Date(attempt.started_at).getTime();
            const now = new Date().getTime();
            const elapsed = Math.floor((now - start) / 1000);
            setTimeSpent(elapsed);
        }, 1000);

        return () => clearInterval(timer);
    }, [attempt?.started_at]);

    // Answer handler
    const handleAnswer = (answer) => {
        if (!currentQuestion) return;
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: answer
        }));
    };

    // Navigation
    const goToNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const goToQuestion = (index) => {
        setCurrentIndex(index);
    };

    // Submit handler
    const handleSubmit = async () => {
        if (!attempt) return;

        try {
            setSubmitting(true);

            // Format answers for API
            const formattedAnswers = {};
            Object.entries(answers).forEach(([qId, answer]) => {
                formattedAnswers[qId] = [answer]; // Wrap in array for comparison
            });

            const { data: result, error } = await supabase
                .rpc('submit_assessment_attempt', {
                    p_attempt_id: attempt.id,
                    p_answers: formattedAnswers,
                    p_time_spent: timeSpent,
                    p_tab_switches: tabSwitches
                });

            if (error) throw error;

            // Navigate to result page
            navigate(`/assessment/${slug}/result?attempt=${attempt.id}`, { replace: true });
        } catch (err) {
            console.error('Error submitting:', err);
            gooeyToast('Có lỗi khi nộp bài. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
            setShowSubmitModal(false);
        }
    };

    // Time up handler
    const handleTimeUp = () => {
        handleSubmit();
    };

    // Loading state - Skeleton Loading for better UX
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                {/* Skeleton Header */}
                <header className="flex-shrink-0 bg-white border-b border-neutral-200">
                    <div className="flex items-center justify-between px-6 h-16">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-neutral-200 animate-pulse rounded" />
                            <div className="hidden sm:block">
                                <div className="h-4 w-32 bg-neutral-200 animate-pulse rounded" />
                            </div>
                        </div>
                        <div className="flex-1 max-w-md mx-4">
                            <div className="h-2 bg-neutral-100 rounded overflow-hidden">
                                <div className="h-full bg-neutral-200 animate-pulse w-1/3" />
                            </div>
                        </div>
                        <div className="w-24 h-10 bg-neutral-200 animate-pulse rounded" />
                    </div>
                </header>

                {/* Skeleton Content */}
                <main className="flex-1 flex">
                    <div className="flex-1 max-w-4xl mx-auto p-6 lg:p-12">
                        {/* Question number */}
                        <div className="h-4 w-24 bg-neutral-200 animate-pulse rounded mb-4" />

                        {/* Question text */}
                        <div className="space-y-3 mb-8">
                            <div className="h-6 bg-neutral-200 animate-pulse rounded w-full" />
                            <div className="h-6 bg-neutral-200 animate-pulse rounded w-3/4" />
                        </div>

                        {/* Answer options */}
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="h-16 bg-neutral-100 animate-pulse rounded border-2 border-neutral-200"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                />
                            ))}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between mt-12">
                            <div className="w-32 h-12 bg-neutral-200 animate-pulse rounded" />
                            <div className="w-32 h-12 bg-neutral-300 animate-pulse rounded" />
                        </div>
                    </div>

                    {/* Skeleton Sidebar */}
                    <div className="hidden xl:block w-64 bg-neutral-50 border-l border-neutral-200 p-6">
                        <div className="h-4 w-32 bg-neutral-200 animate-pulse rounded mb-4" />
                        <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="w-8 h-8 bg-neutral-200 animate-pulse rounded" />
                            ))}
                        </div>
                    </div>
                </main>

                {/* Loading indicator text */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 pointer-events-none">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 text-[#FF4D00] animate-spin mx-auto mb-3" />
                        <p className="text-neutral-600 font-medium">Đang tải bài test...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Guest info form
    if (needsGuestInfo) {
        return <GuestForm onSubmit={handleGuestSubmit} loading={loading} />;
    }

    // No questions
    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-neutral-900 mb-2">Không có câu hỏi</h2>
                    <p className="text-neutral-500 mb-6">Bài test này chưa có câu hỏi.</p>
                    <button
                        onClick={() => navigate('/assessment')}
                        className="px-6 py-3 bg-neutral-900 text-white font-medium"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col select-none">
            <SEOHead
                title={test?.title || 'Làm bài test'}
                noindex
            />

            {/* Header */}
            <header className="flex-shrink-0 bg-white border-b border-neutral-200">
                <div className="flex items-center justify-between px-6 h-16">
                    {/* Left - Logo & Test Name */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (confirm('Bạn có chắc muốn thoát? Tiến độ sẽ không được lưu.')) {
                                    navigate('/assessment');
                                }
                            }}
                            className="p-2 hover:bg-neutral-100 transition-colors"
                        >
                            <Home className="w-5 h-5 text-neutral-500" />
                        </button>
                        <div className="hidden sm:block">
                            <h1 className="text-sm font-semibold text-neutral-900">{test?.title}</h1>
                        </div>
                    </div>

                    {/* Center - Progress */}
                    <div className="flex-1 max-w-md mx-4">
                        <ProgressBar current={currentIndex + 1} total={questions.length} />
                    </div>

                    {/* Right - Timer */}
                    {attempt && (
                        <Timer
                            startTime={attempt.started_at}
                            durationSeconds={attempt.time_limit_seconds || (test?.duration_minutes * 60) || 1800}
                            onTimeUp={handleTimeUp}
                            isPaused={submitting}
                        />
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Question Area */}
                <QuestionCard
                    question={currentQuestion}
                    selectedAnswer={answers[currentQuestion.id]}
                    onAnswer={handleAnswer}
                />

                {/* Navigator Sidebar */}
                <QuestionNavigator
                    questions={questions}
                    answers={answers}
                    currentIndex={currentIndex}
                    onNavigate={goToQuestion}
                />
            </div>

            {/* Footer - Navigation */}
            <footer className="flex-shrink-0 bg-white border-t border-neutral-200">
                <div className="flex items-center justify-between px-6 h-16">
                    {/* Previous */}
                    <button
                        onClick={goToPrev}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-600
                                 hover:bg-neutral-100 transition-colors disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Câu trước</span>
                    </button>

                    {/* Submit Button (visible on last question or anytime) */}
                    <button
                        onClick={() => setShowSubmitModal(true)}
                        className="px-6 py-2 bg-[#FF4D00] text-white font-semibold
                                 hover:bg-[#E64500] transition-colors flex items-center gap-2"
                    >
                        <Flag className="w-4 h-4" />
                        Nộp bài
                    </button>

                    {/* Next */}
                    <button
                        onClick={goToNext}
                        disabled={currentIndex === questions.length - 1}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white
                                 hover:bg-neutral-800 transition-colors disabled:opacity-30"
                    >
                        <span className="hidden sm:inline">Câu sau</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </footer>

            {/* Submit Modal */}
            <SubmitModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmit}
                unansweredCount={unansweredCount}
                loading={submitting}
            />
        </div>
    );
};

export default QuizPage;
