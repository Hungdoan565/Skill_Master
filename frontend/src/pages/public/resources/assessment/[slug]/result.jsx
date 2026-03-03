import { gooeyToast } from 'goey-toast';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    Trophy, Target, Clock, BookOpen, ArrowRight, RotateCcw,
    CheckCircle, XCircle, Award, TrendingUp, Download, Share2,
    Loader2, Home, Star, ChevronRight, ChevronLeft, List, Eye,
    Lightbulb, Check, X
} from 'lucide-react';
import { SEOHead } from '@/components/common';
import { supabase } from '@/lib/supabaseClient';

// ============================================
// RESULT PAGE - Assessment Results Display
// ============================================

// Animated Score Circle
const ScoreCircle = ({ percentage, size = 200, strokeWidth = 12 }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (animatedPercentage / 100) * circumference;

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedPercentage(percentage);
        }, 300);
        return () => clearTimeout(timer);
    }, [percentage]);

    const getColor = (pct) => {
        if (pct >= 80) return '#10b981'; // Emerald
        if (pct >= 60) return '#3b82f6'; // Blue
        if (pct >= 40) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    const color = getColor(percentage);

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className="text-5xl font-bold transition-colors duration-500"
                    style={{ color }}
                >
                    {Math.round(animatedPercentage)}%
                </span>
                <span className="text-sm text-neutral-500 mt-1">Điểm số</span>
            </div>
        </div>
    );
};

// Level Badge
const LevelBadge = ({ levelCode, levelName, color }) => {
    return (
        <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-none"
            style={{ backgroundColor: `${color}20`, borderLeft: `4px solid ${color}` }}
        >
            <Award className="w-6 h-6" style={{ color }} />
            <div>
                <span className="block text-sm text-neutral-500">Trình độ của bạn</span>
                <span className="text-xl font-bold" style={{ color }}>
                    {levelCode} - {levelName}
                </span>
            </div>
        </div>
    );
};

// Stats Card
const StatsCard = ({ icon: Icon, label, value, subtext }) => (
    <div className="bg-white border border-neutral-200 p-6">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-neutral-100">
                <Icon className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
                <span className="text-2xl font-bold text-neutral-900">{value}</span>
                <p className="text-sm text-neutral-500 mt-1">{label}</p>
                {subtext && <p className="text-xs text-neutral-400 mt-1">{subtext}</p>}
            </div>
        </div>
    </div>
);

// Course Recommendation Card
const CourseCard = ({ course }) => (
    <Link
        to={`/courses/${course.id || course.slug}`}
        className="group block bg-white border-2 border-neutral-200 p-6 
                 hover:border-[#FF4D00] hover:shadow-lg transition-all duration-300"
    >
        <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-[#FF4D00]/10 group-hover:bg-[#FF4D00] transition-colors">
                <BookOpen className="w-5 h-5 text-[#FF4D00] group-hover:text-white transition-colors" />
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-[#FF4D00] 
                                 group-hover:translate-x-1 transition-all" />
        </div>
        <h4 className="font-bold text-neutral-900 mb-2 group-hover:text-[#FF4D00] transition-colors">
            {course.title || course.name}
        </h4>
        <p className="text-sm text-neutral-500 line-clamp-2">
            {course.description || 'Khóa học phù hợp với trình độ của bạn'}
        </p>
    </Link>
);

// ============================================
// QUESTION REVIEW COMPONENT
// ============================================
const QuestionReview = ({ question, index, total, onPrev, onNext }) => {
    if (!question) return null;

    const userAnswer = question.user_answer?.[0] || question.user_answer;
    const correctAnswer = question.correct_answer?.[0] || question.correct_answer;
    const isCorrect = userAnswer === correctAnswer;

    return (
        <div className="bg-white border-2 border-neutral-200 p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-neutral-500">
                    Câu {index + 1}/{total}
                </span>
                {question.skill_area && (
                    <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 uppercase">
                        {question.skill_area}
                    </span>
                )}
            </div>

            {/* Question Text */}
            <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                {question.question_text}
            </h3>

            {/* Options */}
            <div className="space-y-3 mb-8">
                {(question.options || []).map((option, i) => {
                    const label = String.fromCharCode(65 + i); // A, B, C, D
                    const isUserChoice = userAnswer === option;
                    const isCorrectOption = correctAnswer === option;

                    let bgClass = 'bg-white border-neutral-200';
                    let borderClass = 'border-neutral-200';
                    let textClass = 'text-neutral-700';

                    if (isCorrectOption) {
                        bgClass = 'bg-emerald-50';
                        borderClass = 'border-emerald-500';
                        textClass = 'text-emerald-800';
                    } else if (isUserChoice && !isCorrect) {
                        bgClass = 'bg-red-50';
                        borderClass = 'border-red-400';
                        textClass = 'text-red-800';
                    }

                    return (
                        <div
                            key={i}
                            className={`p-4 border-2 rounded ${bgClass} ${borderClass} transition-all`}
                        >
                            <div className="flex items-center gap-3">
                                {isCorrectOption && (
                                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                )}
                                {isUserChoice && !isCorrect && (
                                    <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                                )}
                                {!isCorrectOption && !isUserChoice && (
                                    <div className="w-5 h-5 flex-shrink-0" />
                                )}
                                <span className={`font-medium ${textClass}`}>{label}.</span>
                                <span className={textClass}>{option}</span>
                                {isUserChoice && (
                                    <span className="ml-auto text-sm text-neutral-500">(Bạn chọn)</span>
                                )}
                                {isCorrectOption && !isUserChoice && (
                                    <span className="ml-auto text-sm text-emerald-600 font-medium">(Đáp án đúng)</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Result Indicator */}
            <div className={`p-4 rounded-lg mb-6 ${isCorrect
                ? 'bg-emerald-50 border-2 border-emerald-200'
                : 'bg-red-50 border-2 border-red-200'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? (
                        <>
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold text-emerald-800">CHÍNH XÁC!</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-800">SAI RỒI!</span>
                        </>
                    )}
                </div>

                {question.explanation && (
                    <div className="flex items-start gap-2 mt-3">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-neutral-700">
                            <span className="font-medium">Giải thích:</span> {question.explanation}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={onPrev}
                    disabled={index === 0}
                    className="flex items-center gap-2 px-5 py-3 border-2 border-neutral-200 
                             text-neutral-700 disabled:opacity-40 hover:border-neutral-400 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Câu Trước
                </button>
                <button
                    onClick={onNext}
                    disabled={index === total - 1}
                    className="flex items-center gap-2 px-5 py-3 bg-[#FF4D00] text-white 
                             disabled:opacity-40 hover:bg-[#E64500] transition-colors"
                >
                    Câu Tiếp
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


// ============================================
// MAIN RESULT PAGE
// ============================================
export const ResultPage = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const attemptId = searchParams.get('attempt');

    const [result, setResult] = useState(null);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recommendedCourses, setRecommendedCourses] = useState([]);
    const [shareStatus, setShareStatus] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Answer Review states
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'review'
    const [questionDetails, setQuestionDetails] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [reviewLoading, setReviewLoading] = useState(false);

    // Share handler - uses Web Share API with clipboard fallback
    const handleShare = async () => {
        const shareData = {
            title: `Kết quả ${test?.title || 'Bài test'} - Skill Master`,
            text: `Tôi vừa đạt ${result?.percentage}% (${result?.result_level}) trong bài kiểm tra ${test?.title || 'đánh giá năng lực'}!`,
            url: window.location.href
        };

        try {
            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData);
                setShareStatus('success');
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(
                    `${shareData.text}\n\nXem chi tiết: ${shareData.url}`
                );
                setShareStatus('success');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                setShareStatus('error');
            }
        }

        // Reset status after 3 seconds
        setTimeout(() => setShareStatus(null), 3000);
    };

    // PDF download handler - uses browser print dialog for reliability
    const handleDownloadPDF = () => {
        setPdfLoading(true);

        // Create a printable version
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Kết quả ${test?.title || 'Bài test'} - Skill Master</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 3px solid #FF4D00; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { font-size: 24px; font-weight: bold; color: #171717; }
                    .title { font-size: 28px; font-weight: bold; margin: 20px 0 10px; }
                    .score-circle { text-align: center; margin: 40px 0; }
                    .percentage { font-size: 72px; font-weight: bold; color: ${result?.percentage >= 60 ? '#10b981' : result?.percentage >= 40 ? '#f59e0b' : '#ef4444'}; }
                    .level { display: inline-block; background: #FF4D00; color: white; padding: 10px 20px; font-weight: bold; margin: 20px 0; }
                    .stats { display: flex; justify-content: space-around; margin: 30px 0; padding: 20px; background: #f5f5f5; }
                    .stat-item { text-align: center; }
                    .stat-value { font-size: 24px; font-weight: bold; }
                    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
                    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px; }
                    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">Skill Master</div>
                    <div class="title">${test?.title || 'Kết quả bài test'}</div>
                    <p>Ngày: ${new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                
                <div class="score-circle">
                    <div class="percentage">${result?.percentage || 0}%</div>
                    <p>Điểm số đạt được</p>
                </div>
                
                <div style="text-align: center;">
                    <div class="level">${result?.result_level || 'A1'} - ${result?.result_level_name || 'Sơ cấp'}</div>
                </div>
                
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-value">${result?.score || 0}/${result?.max_score || 30}</div>
                        <div class="stat-label">Số câu đúng</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Math.floor((result?.time_spent_seconds || 0) / 60)}:${String((result?.time_spent_seconds || 0) % 60).padStart(2, '0')}</div>
                        <div class="stat-label">Thời gian làm bài</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${result?.result_level || 'A1'}</div>
                        <div class="stat-label">Xếp hạng CEFR</div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Skill Master - Kết quả đánh giá năng lực</p>
                    <p>Website: skillmaster.vn</p>
                </div>
            </body>
            </html>
        `;

        // Open print dialog
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.print();
                setPdfLoading(false);
            };
        } else {
            gooeyToast('Không thể mở cửa sổ in. Vui lòng tắt popup blocker và thử lại.');
            setPdfLoading(false);
        }
    };

    // Fetch result data
    useEffect(() => {
        const fetchResult = async () => {
            if (!attemptId) {
                navigate('/assessment', { replace: true });
                return;
            }

            try {
                // Fetch attempt
                const { data: attemptData, error: attemptError } = await supabase
                    .from('assessment_attempts')
                    .select('*, assessment_tests(*)')
                    .eq('id', attemptId)
                    .eq('status', 'completed')
                    .single();

                if (attemptError) throw attemptError;

                setResult(attemptData);
                setTest(attemptData.assessment_tests);

                // Fetch result mapping for recommended courses
                const { data: mappingData } = await supabase
                    .from('assessment_results_mapping')
                    .select('*')
                    .eq('test_id', attemptData.test_id)
                    .gte('max_percentage', attemptData.percentage)
                    .lte('min_percentage', attemptData.percentage)
                    .single();

                if (mappingData?.recommended_courses?.length > 0) {
                    // Fetch actual course details
                    const { data: coursesData } = await supabase
                        .from('courses')
                        .select('id, name, description, slug')
                        .in('id', mappingData.recommended_courses);

                    setRecommendedCourses(coursesData || []);
                }
            } catch (err) {
                console.error('Error fetching result:', err);
                // Use mock data for demo
                setResult({
                    id: attemptId,
                    score: 18,
                    max_score: 30,
                    percentage: 60,
                    result_level: 'B1',
                    result_level_name: 'Trung cấp',
                    time_spent_seconds: 1245,
                    completed_at: new Date().toISOString(),
                });
                setTest({
                    title: 'Kiểm tra trình độ IELTS',
                    total_questions: 30,
                    duration_minutes: 30,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [attemptId, navigate]);

    // Trigger email sending (once on load)
    useEffect(() => {
        if (!result?.id || result?.email_sent) return;

        // TODO: Enable after verifying custom domain on Resend
        // Currently disabled because sandbox domain only sends to account owner
        // See: C:\Users\hiend\.gemini\antigravity\brain\...\resend_domain_verification.md
        /*
        useEffect(() => {
          const sendResultEmail = async () => {
            if (!result?.id || result.email_sent) return
      
            try {
              const { data, error } = await supabase.functions.invoke('send-assessment-result', {
                body: { attemptId: result.id }
              })
      
              if (error) {
                console.error('Failed to send email:', error)
              } else {
                console.log('Email sent successfully:', data)
              }
            } catch (err) {
              console.error('Error sending email:', err)
            }
          }
      
          sendResultEmail()
        }, [result])
        */ // Non-blocking, don't show error to user
    }, [result?.id, result?.email_sent]);

    // Fetch question details when switching to review tab
    useEffect(() => {
        if (activeTab !== 'review' || questionDetails.length > 0 || !attemptId) return;

        const fetchQuestionDetails = async () => {
            setReviewLoading(true);
            try {
                const { data, error } = await supabase
                    .rpc('get_attempt_review', { p_attempt_id: attemptId });

                if (error) throw error;
                if (data?.questions) {
                    setQuestionDetails(data.questions);
                }
            } catch (err) {
                console.error('Error fetching question details:', err);
            } finally {
                setReviewLoading(false);
            }
        };

        fetchQuestionDetails();
    }, [activeTab, attemptId, questionDetails.length]);

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins} phút ${secs} giây`;
    };

    // Get level color
    const getLevelColor = (level) => {
        const colors = {
            'A1': '#6b7280',
            'A2': '#10b981',
            'B1': '#3b82f6',
            'B2': '#8b5cf6',
            'C1': '#f59e0b',
            'C2': '#ef4444',
            'Basic': '#6b7280',
            'Intermediate': '#3b82f6',
            'Advanced': '#f59e0b',
        };
        return colors[level] || '#3b82f6';
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#FF4D00] animate-spin mx-auto mb-4" />
                    <p className="text-neutral-600">Đang tải kết quả...</p>
                </div>
            </div>
        );
    }

    // No result found
    if (!result) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-neutral-900 mb-2">Không tìm thấy kết quả</h2>
                    <p className="text-neutral-500 mb-6">Vui lòng làm bài test trước.</p>
                    <Link
                        to="/assessment"
                        className="px-6 py-3 bg-neutral-900 text-white font-medium inline-flex items-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Quay lại
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <SEOHead
                title="Kết quả bài test"
                noindex
            />

            {/* Header */}
            <header className="bg-white border-b border-neutral-200">
                <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="text-xl font-bold text-neutral-900">
                            Skill Master
                        </Link>
                        <Link
                            to="/assessment"
                            className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Làm bài test khác
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-12 lg:py-16">
                <div className="max-w-[1200px] mx-auto px-6 lg:px-12">

                    {/* Hero - Score Section */}
                    <div className="bg-white border-2 border-neutral-200 p-8 lg:p-12 mb-8">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            {/* Left - Score */}
                            <div className="text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 
                                              text-emerald-600 text-sm font-medium mb-4">
                                    <CheckCircle className="w-4 h-4" />
                                    Hoàn thành bài test
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
                                    {test?.title || 'Kết quả bài test'}
                                </h1>
                                <p className="text-neutral-500 mb-8">
                                    Dưới đây là kết quả đánh giá năng lực của bạn
                                </p>

                                {/* Level Badge */}
                                <LevelBadge
                                    levelCode={result.result_level}
                                    levelName={result.result_level_name}
                                    color={getLevelColor(result.result_level)}
                                />
                            </div>

                            {/* Right - Score Circle */}
                            <div className="flex justify-center">
                                <ScoreCircle percentage={result.percentage} size={220} />
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <StatsCard
                            icon={Target}
                            label="Số câu đúng"
                            value={`${result.score}/${result.max_score}`}
                            subtext={`Đúng ${Math.round((result.score / result.max_score) * 100)}% câu hỏi`}
                        />
                        <StatsCard
                            icon={Clock}
                            label="Thời gian làm bài"
                            value={formatTime(result.time_spent_seconds || 0)}
                            subtext={`Thời gian tối đa: ${test?.duration_minutes || 30} phút`}
                        />
                        <StatsCard
                            icon={TrendingUp}
                            label="Xếp hạng"
                            value={result.result_level}
                            subtext="Theo chuẩn CEFR quốc tế"
                        />
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-8 border-b border-neutral-200">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === 'overview'
                                ? 'border-[#FF4D00] text-[#FF4D00]'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Tổng Quan
                        </button>
                        <button
                            onClick={() => setActiveTab('review')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === 'review'
                                ? 'border-[#FF4D00] text-[#FF4D00]'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900'
                                }`}
                        >
                            <Eye className="w-4 h-4" />
                            Xem Chi Tiết Đáp Án
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' ? (
                        <>
                            {/* Result Description */}
                            <div className="bg-white border border-neutral-200 p-6 lg:p-8 mb-8">
                                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-[#FF4D00]" />
                                    Đánh giá chi tiết
                                </h2>
                                <div className="prose prose-neutral max-w-none">
                                    <p className="text-neutral-600 leading-relaxed">
                                        Dựa trên kết quả bài test, trình độ của bạn được đánh giá ở mức{' '}
                                        <strong className="text-neutral-900">{result.result_level} - {result.result_level_name}</strong>.
                                        {result.percentage >= 80 && ' Đây là kết quả xuất sắc! Bạn có nền tảng rất vững chắc.'}
                                        {result.percentage >= 60 && result.percentage < 80 && ' Bạn có nền tảng khá tốt và có thể tiến bộ nhanh với khóa học phù hợp.'}
                                        {result.percentage >= 40 && result.percentage < 60 && ' Bạn có kiến thức cơ bản. Với lộ trình học tập phù hợp, bạn sẽ tiến bộ nhanh chóng.'}
                                        {result.percentage < 40 && ' Bạn đang ở giai đoạn bắt đầu. Đừng lo, với khóa học nền tảng, bạn sẽ tiến bộ từng bước.'}
                                    </p>
                                </div>
                            </div>

                            {/* Recommended Courses */}
                            <div className="bg-neutral-900 text-white p-6 lg:p-8 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-[#FF4D00]" />
                                        Khóa học đề xuất
                                    </h2>
                                    <Link
                                        to="/courses"
                                        className="text-sm text-neutral-400 hover:text-white flex items-center gap-1"
                                    >
                                        Xem tất cả <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {recommendedCourses.length > 0 ? (
                                        recommendedCourses.map(course => (
                                            <CourseCard key={course.id} course={course} />
                                        ))
                                    ) : (
                                        // Default recommendations based on level
                                        <>
                                            <CourseCard course={{
                                                name: result.result_level === 'A1' || result.result_level === 'A2'
                                                    ? 'IELTS Foundation'
                                                    : 'IELTS Intensive',
                                                description: 'Khóa học phù hợp với trình độ của bạn',
                                                slug: 'ielts-foundation'
                                            }} />
                                            <CourseCard course={{
                                                name: 'Speaking Workshop',
                                                description: 'Luyện nói với giáo viên bản ngữ',
                                                slug: 'speaking-workshop'
                                            }} />
                                            <CourseCard course={{
                                                name: 'Grammar Master',
                                                description: 'Củng cố ngữ pháp nền tảng',
                                                slug: 'grammar-master'
                                            }} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="bg-[#FF4D00] text-white p-8 lg:p-12 text-center">
                                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-80" />
                                <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                                    Sẵn sàng bắt đầu hành trình?
                                </h2>
                                <p className="text-white/80 mb-8 max-w-xl mx-auto">
                                    Đăng ký tư vấn miễn phí để nhận lộ trình học tập được cá nhân hóa dựa trên kết quả của bạn.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        to="/contact"
                                        className="px-8 py-4 bg-white text-[#FF4D00] font-bold uppercase tracking-wider
                                         hover:bg-neutral-100 transition-colors inline-flex items-center justify-center gap-2"
                                    >
                                        Đăng ký tư vấn
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                    <Link
                                        to="/courses"
                                        className="px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-wider
                                         hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
                                    >
                                        Xem khóa học
                                    </Link>
                                </div>
                            </div>

                            {/* Share & Actions */}
                            <div className="flex flex-wrap gap-4 justify-center mt-8">
                                <button
                                    onClick={handleShare}
                                    className={`flex items-center gap-2 px-4 py-2 border transition-all ${shareStatus === 'success'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                        : shareStatus === 'error'
                                            ? 'border-red-500 bg-red-50 text-red-600'
                                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                        }`}
                                >
                                    {shareStatus === 'success' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Đã sao chép!
                                        </>
                                    ) : shareStatus === 'error' ? (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Thất bại
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-4 h-4" />
                                            Chia sẻ kết quả
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={pdfLoading}
                                    className="flex items-center gap-2 px-4 py-2 border border-neutral-200 
                                     text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                                >
                                    {pdfLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    {pdfLoading ? 'Đang tạo...' : 'Tải PDF'}
                                </button>
                                <Link
                                    to="/assessment"
                                    className="flex items-center gap-2 px-4 py-2 border border-neutral-200 
                                     text-neutral-600 hover:bg-neutral-50 transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Làm bài test khác
                                </Link>
                            </div>
                        </>
                    ) : (
                        /* Answer Review Tab */
                        <div className="mb-8">
                            {reviewLoading ? (
                                <div className="bg-white border-2 border-neutral-200 p-12 text-center">
                                    <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin mx-auto mb-4" />
                                    <p className="text-neutral-600">Đang tải chi tiết câu hỏi...</p>
                                </div>
                            ) : questionDetails.length > 0 ? (
                                <>
                                    {/* Question Grid Navigation */}
                                    <div className="bg-white border-2 border-neutral-200 p-4 mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            {questionDetails.map((q, idx) => {
                                                const userAns = q.user_answer?.[0] || q.user_answer;
                                                const correctAns = q.correct_answer?.[0] || q.correct_answer;
                                                const isCorrect = userAns === correctAns;
                                                const isCurrent = idx === currentQuestionIndex;

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentQuestionIndex(idx)}
                                                        className={`w-10 h-10 rounded text-sm font-medium transition-all ${isCurrent
                                                            ? 'bg-[#FF4D00] text-white'
                                                            : isCorrect
                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                                : 'bg-red-100 text-red-700 border border-red-300'
                                                            }`}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-4 mt-4 text-xs">
                                            <span className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded" />
                                                Đúng
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
                                                Sai
                                            </span>
                                        </div>
                                    </div>

                                    {/* Current Question */}
                                    <QuestionReview
                                        question={questionDetails[currentQuestionIndex]}
                                        index={currentQuestionIndex}
                                        total={questionDetails.length}
                                        onPrev={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                                        onNext={() => setCurrentQuestionIndex(i => Math.min(questionDetails.length - 1, i + 1))}
                                    />
                                </>
                            ) : (
                                <div className="bg-white border-2 border-neutral-200 p-12 text-center">
                                    <XCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                                    <p className="text-neutral-600">Không có dữ liệu câu hỏi</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-neutral-200 py-8">
                <div className="max-w-[1200px] mx-auto px-6 lg:px-12 text-center text-sm text-neutral-500">
                    <p>© 2024 Skill Master. Tất cả quyền được bảo lưu.</p>
                </div>
            </footer>
        </div>
    );
};

export default ResultPage;
