import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Type,
    Minus,
    Plus,
    Volume2,
    VolumeX,
    Pause,
    Play,
    BookOpen,
    X,
    Settings
} from 'lucide-react';

// ============================================
// FONT SIZE TOGGLE
// ============================================
// A- A A+ buttons for accessibility
// ============================================
export const FontSizeToggle = ({ onSizeChange }) => {
    const [size, setSize] = useState('medium'); // small, medium, large, xlarge

    const sizes = {
        small: { label: 'Nhỏ', bodySize: '16px', headingScale: 0.9 },
        medium: { label: 'Vừa', bodySize: '18px', headingScale: 1 },
        large: { label: 'Lớn', bodySize: '20px', headingScale: 1.1 },
        xlarge: { label: 'Rất lớn', bodySize: '22px', headingScale: 1.2 }
    };

    const sizeKeys = Object.keys(sizes);
    const currentIndex = sizeKeys.indexOf(size);

    const decrease = () => {
        if (currentIndex > 0) {
            const newSize = sizeKeys[currentIndex - 1];
            setSize(newSize);
            onSizeChange?.(sizes[newSize]);
        }
    };

    const increase = () => {
        if (currentIndex < sizeKeys.length - 1) {
            const newSize = sizeKeys[currentIndex + 1];
            setSize(newSize);
            onSizeChange?.(sizes[newSize]);
        }
    };

    return (
        <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
            <button
                onClick={decrease}
                disabled={currentIndex === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:bg-white hover:shadow-sm transition-all text-zinc-600"
                aria-label="Giảm cỡ chữ"
            >
                <Minus className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 flex items-center justify-center">
                <Type className="w-4 h-4 text-zinc-600" />
            </div>
            <button
                onClick={increase}
                disabled={currentIndex === sizeKeys.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:bg-white hover:shadow-sm transition-all text-zinc-600"
                aria-label="Tăng cỡ chữ"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
};

// ============================================
// TEXT TO SPEECH
// ============================================
// Read article aloud using Web Speech API
// ============================================
export const TextToSpeech = ({ text, title }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const utteranceRef = useRef(null);

    useEffect(() => {
        if (!('speechSynthesis' in window)) {
            setIsSupported(false);
        }

        return () => {
            window.speechSynthesis?.cancel();
        };
    }, []);

    const extractTextFromHTML = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        // Remove code blocks
        div.querySelectorAll('pre, code').forEach(el => el.remove());
        return div.textContent || div.innerText || '';
    };

    const speak = () => {
        if (!isSupported) return;

        window.speechSynthesis.cancel();

        const cleanText = title + '. ' + extractTextFromHTML(text);
        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Vietnamese voice if available
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.startsWith('vi'));
        if (viVoice) utterance.voice = viVoice;

        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => {
            setIsPlaying(true);
            setIsPaused(false);
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        utterance.onerror = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const pause = () => {
        window.speechSynthesis.pause();
        setIsPaused(true);
    };

    const resume = () => {
        window.speechSynthesis.resume();
        setIsPaused(false);
    };

    const stop = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
    };

    if (!isSupported) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {!isPlaying ? (
                <button
                    onClick={speak}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 
                        hover:bg-stone-200 text-zinc-600 rounded-xl transition-all"
                    aria-label="Nghe bài viết"
                >
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Nghe</span>
                </button>
            ) : (
                <div className="flex items-center gap-1 bg-red-50 rounded-xl p-1">
                    <button
                        onClick={isPaused ? resume : pause}
                        className="w-8 h-8 flex items-center justify-center rounded-lg
                            hover:bg-white transition-all text-red-600"
                        aria-label={isPaused ? "Tiếp tục" : "Tạm dừng"}
                    >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={stop}
                        className="w-8 h-8 flex items-center justify-center rounded-lg
                            hover:bg-white transition-all text-red-600"
                        aria-label="Dừng đọc"
                    >
                        <VolumeX className="w-4 h-4" />
                    </button>
                    <div className="px-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-red-600">
                            {isPaused ? 'Tạm dừng' : 'Đang đọc...'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// READING MODE (Focus Mode)
// ============================================
// Hide sidebars, maximize content
// ============================================
export const ReadingModeToggle = ({ isActive, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                ${isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                    : 'bg-stone-100 hover:bg-stone-200 text-zinc-600'
                }`}
            aria-label={isActive ? "Tắt chế độ đọc" : "Bật chế độ đọc"}
        >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">
                {isActive ? 'Thoát' : 'Chế độ đọc'}
            </span>
        </button>
    );
};

// Reading Mode Overlay
export const ReadingModeOverlay = ({ post, content, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-stone-50 overflow-y-auto">
            {/* Close button */}
            <button
                onClick={onClose}
                className="fixed top-6 right-6 w-12 h-12 bg-white rounded-full 
                    shadow-lg flex items-center justify-center z-50
                    hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label="Đóng chế độ đọc"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-6 py-16">
                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-6 leading-tight">
                    {post.title}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-stone-200">
                    <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <p className="text-sm font-medium text-zinc-900">{post.author.name}</p>
                        <p className="text-xs text-zinc-500">{post.readTime} phút đọc</p>
                    </div>
                </div>

                {/* Article */}
                <article
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        </div>
    );
};

// ============================================
// ESTIMATED TIME LEFT
// ============================================
// Shows "Còn ~5 phút" based on progress
// ============================================
export const EstimatedTimeLeft = ({ totalMinutes, progress }) => {
    const minutesLeft = Math.max(1, Math.ceil(totalMinutes * (1 - progress / 100)));

    if (progress >= 95) {
        return (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                ✓ Hoàn thành
            </span>
        );
    }

    return (
        <span className="text-sm text-zinc-500">
            Còn ~<span className="font-semibold text-zinc-700">{minutesLeft}</span> phút
        </span>
    );
};

// ============================================
// ARTICLE SETTINGS PANEL
// ============================================
// Combined settings dropdown
// ============================================
export const ArticleSettingsPanel = ({
    onSizeChange,
    articleText,
    articleTitle,
    readingMode,
    onReadingModeToggle
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                    ${isOpen
                        ? 'bg-zinc-900 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-zinc-600'
                    }`}
                aria-label="Cài đặt bài viết"
            >
                <Settings className="w-5 h-5" />
            </button>

            {/* Dropdown Panel */}
            <div className={`absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl 
                shadow-xl border border-stone-200 overflow-hidden z-50
                transition-all duration-300 origin-top-right
                ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
                <div className="p-4 border-b border-stone-100">
                    <h3 className="text-sm font-semibold text-zinc-900">Tùy chỉnh đọc</h3>
                </div>

                <div className="p-4 space-y-4">
                    {/* Font Size */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-600">Cỡ chữ</span>
                        <FontSizeToggle onSizeChange={onSizeChange} />
                    </div>

                    {/* Text to Speech */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-600">Nghe bài viết</span>
                        <TextToSpeech text={articleText} title={articleTitle} />
                    </div>

                    {/* Reading Mode */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-600">Chế độ tập trung</span>
                        <ReadingModeToggle
                            isActive={readingMode}
                            onToggle={onReadingModeToggle}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default {
    FontSizeToggle,
    TextToSpeech,
    ReadingModeToggle,
    ReadingModeOverlay,
    EstimatedTimeLeft,
    ArticleSettingsPanel
};
