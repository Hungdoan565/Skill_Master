import { toast } from "sonner";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

// ============================================
// EMOJI REACTIONS COMPONENT
// ============================================
// Premium reaction system with animations
// ============================================

const REACTIONS = [
    { type: 'like', emoji: '👍', label: 'Thích' },
    { type: 'love', emoji: '❤️', label: 'Yêu thích' },
    { type: 'fire', emoji: '🔥', label: 'Hào hứng' },
    { type: 'clap', emoji: '👏', label: 'Tuyệt vời' },
    { type: 'bulb', emoji: '💡', label: 'Sáng tạo' }
];

export const EmojiReactions = ({ postSlug }) => {
    const { user } = useAuth();
    const [counts, setCounts] = useState({});
    const [userReactions, setUserReactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch reactions count and user's own reactions
    const fetchReactions = async () => {
        try {
            // Get all reactions for this post
            const { data: allReactions, error } = await supabase
                .from('blog_article_reactions')
                .select('reaction_type, user_id')
                .eq('post_slug', postSlug);

            if (error) throw error;

            // Calculate counts
            const newCounts = allReactions.reduce((acc, curr) => {
                acc[curr.reaction_type] = (acc[curr.reaction_type] || 0) + 1;
                return acc;
            }, {});
            setCounts(newCounts);

            // Filter user's reactions
            if (user) {
                const myReactions = allReactions
                    .filter(r => r.user_id === user.id)
                    .map(r => r.reaction_type);
                setUserReactions(myReactions);
            }
        } catch (err) {
            console.error('[Reactions] Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReactions();
    }, [postSlug, user?.id]);

    const handleReact = async (type) => {
        if (!user) {
            toast('Vui lòng đăng nhập để bày tỏ cảm xúc!');
            return;
        }

        if (isProcessing) return;

        const isRemoving = userReactions.includes(type);

        try {
            setIsProcessing(true);

            if (isRemoving) {
                // Remove reaction
                await supabase
                    .from('blog_article_reactions')
                    .delete()
                    .match({
                        post_slug: postSlug,
                        user_id: user.id,
                        reaction_type: type
                    });
            } else {
                // Add reaction
                await supabase
                    .from('blog_article_reactions')
                    .insert({
                        post_slug: postSlug,
                        user_id: user.id,
                        reaction_type: type
                    });
            }

            // Update UI optimistically or refetch
            await fetchReactions();
        } catch (err) {
            console.error('[Reactions] Process error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex gap-4 py-6">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-3 py-8">
            {REACTIONS.map(({ type, emoji, label }) => {
                const count = counts[type] || 0;
                const isSelected = userReactions.includes(type);

                return (
                    <button
                        key={type}
                        onClick={() => handleReact(type)}
                        disabled={isProcessing}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-2xl border
                            transition-all duration-300 relative overflow-hidden
                            ${isSelected
                                ? 'bg-red-50 border-red-200 text-red-600 shadow-sm'
                                : 'bg-white border-stone-200 text-zinc-600 hover:border-red-200 hover:bg-stone-50'
                            }
                            ${isProcessing ? 'opacity-70 cursor-wait' : ''}
                        `}
                    >
                        {/* Emoji with bounce effect */}
                        <span className={`text-xl transition-transform duration-300
                            group-hover:scale-125 group-active:scale-90
                            ${isSelected ? 'scale-110' : ''}
                        `}>
                            {emoji}
                        </span>

                        {/* Count */}
                        <span className="text-sm font-semibold">
                            {count > 0 ? count : ''}
                        </span>

                        {/* Label tooltip (mobile friendly) */}
                        <span className="hidden lg:block text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {label}
                        </span>

                        {/* Particle effect simulation for active state */}
                        {isSelected && (
                            <span className="absolute inset-0 bg-red-600/5 pointer-events-none" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default EmojiReactions;
