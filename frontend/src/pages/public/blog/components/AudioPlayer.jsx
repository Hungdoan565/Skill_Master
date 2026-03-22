import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Settings } from 'lucide-react';

// ============================================
// AUDIO PLAYER - AI VOICE-OVER COMPONENT
// ============================================
// Uses Web Speech API for text-to-speech narration
// ============================================

export const AudioPlayer = ({ content, title }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [rate, setRate] = useState(1);
    const [voice, setVoice] = useState(null);
    const [voices, setVoices] = useState([]);
    const [currentSentence, setCurrentSentence] = useState(0);

    const utteranceRef = useRef(null);
    const sentencesRef = useRef([]);
    const synthRef = useRef(null);

    // Initialize speech synthesis
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;

            const loadVoices = () => {
                const availableVoices = synthRef.current.getVoices();
                // Prefer Vietnamese voices, fallback to English
                const preferredVoices = availableVoices.filter(v =>
                    v.lang.startsWith('vi') || v.lang.startsWith('en')
                );
                setVoices(preferredVoices);
                // Set default voice
                const defaultVoice = preferredVoices.find(v => v.lang.startsWith('vi'))
                    || preferredVoices[0];
                setVoice(defaultVoice);
            };

            loadVoices();
            synthRef.current.onvoiceschanged = loadVoices;
        }

        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Parse content into sentences
    useEffect(() => {
        if (content) {
            // Strip HTML and split into sentences
            const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const sentences = textContent.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
            sentencesRef.current = sentences;
        }
    }, [content]);

    const speak = () => {
        if (!synthRef.current || sentencesRef.current.length === 0) return;

        synthRef.current.cancel();
        setIsPlaying(true);
        setIsPaused(false);

        const speakSentence = (index) => {
            if (index >= sentencesRef.current.length) {
                setIsPlaying(false);
                setProgress(100);
                setCurrentSentence(0);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(sentencesRef.current[index]);
            utterance.voice = voice;
            utterance.rate = rate;
            utterance.pitch = 1;

            utterance.onstart = () => {
                setCurrentSentence(index);
                setProgress((index / sentencesRef.current.length) * 100);
            };

            utterance.onend = () => {
                speakSentence(index + 1);
            };

            utterance.onerror = (e) => {
                console.error('Speech error:', e);
                setIsPlaying(false);
            };

            utteranceRef.current = utterance;
            synthRef.current.speak(utterance);
        };

        // Start with title if available
        if (title) {
            const titleUtterance = new SpeechSynthesisUtterance(`Bài viết: ${title}`);
            titleUtterance.voice = voice;
            titleUtterance.rate = rate;
            titleUtterance.onend = () => speakSentence(currentSentence);
            synthRef.current.speak(titleUtterance);
        } else {
            speakSentence(currentSentence);
        }
    };

    const pause = () => {
        if (synthRef.current) {
            synthRef.current.pause();
            setIsPaused(true);
        }
    };

    const resume = () => {
        if (synthRef.current) {
            synthRef.current.resume();
            setIsPaused(false);
        }
    };

    const stop = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsPlaying(false);
            setIsPaused(false);
            setProgress(0);
            setCurrentSentence(0);
        }
    };

    const skipBack = () => {
        const newIndex = Math.max(0, currentSentence - 3);
        setCurrentSentence(newIndex);
        if (isPlaying) {
            synthRef.current.cancel();
            speak();
        }
    };

    const skipForward = () => {
        const newIndex = Math.min(sentencesRef.current.length - 1, currentSentence + 3);
        setCurrentSentence(newIndex);
        if (isPlaying) {
            synthRef.current.cancel();
            speak();
        }
    };

    // Check if browser supports speech synthesis
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-stone-50 to-stone-100 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl 
                    flex items-center justify-center shadow-lg shadow-red-500/20">
                    <Volume2 className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider mb-1">
                        🎧 Nghe bài viết
                    </p>
                    <div className="flex items-center gap-3">
                        {/* Controls */}
                        <button
                            onClick={skipBack}
                            disabled={!isPlaying}
                            className="p-1.5 text-muted-foreground/70 hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                            <SkipBack className="w-4 h-4" />
                        </button>

                        <button
                            onClick={isPlaying ? (isPaused ? resume : pause) : speak}
                            className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full 
                                flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        >
                            {isPlaying && !isPaused ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5 ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={skipForward}
                            disabled={!isPlaying}
                            className="p-1.5 text-muted-foreground/70 hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                            <SkipForward className="w-4 h-4" />
                        </button>

                        {isPlaying && (
                            <button
                                onClick={stop}
                                className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                            >
                                <VolumeX className="w-4 h-4" />
                            </button>
                        )}

                        {/* Progress Bar */}
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Settings */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-1.5 text-muted-foreground/70 hover:text-foreground transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                            </button>

                            {showSettings && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-card rounded-xl 
                                    border border-border shadow-xl p-3 space-y-3 z-10">
                                    {/* Rate */}
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                                            Tốc độ: {rate}x
                                        </label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2"
                                            step="0.1"
                                            value={rate}
                                            onChange={(e) => setRate(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Voice Selection */}
                                    {voices.length > 0 && (
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                                                Giọng đọc
                                            </label>
                                            <select
                                                value={voice?.name || ''}
                                                onChange={(e) => setVoice(voices.find(v => v.name === e.target.value))}
                                                className="w-full mt-1 text-xs p-1.5 border border-border rounded-lg"
                                            >
                                                {voices.map(v => (
                                                    <option key={v.name} value={v.name}>
                                                        {v.name.split(' ').slice(0, 2).join(' ')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
