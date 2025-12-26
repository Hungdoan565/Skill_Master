import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ============================================
// USE VIEW COUNTER - Track article views
// ============================================

export const useViewCounter = (slug) => {
    const [viewCount, setViewCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch current view count
    const fetchViewCount = useCallback(async () => {
        if (!slug) return;

        try {
            const { data, error } = await supabase
                .from('blog_post_stats')
                .select('view_count')
                .eq('slug', slug)
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = no rows found, which is fine for new posts
                console.warn('Error fetching view count:', error);
            }

            setViewCount(data?.view_count || 0);
        } catch (err) {
            console.error('View counter error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    // Increment view count
    const incrementView = useCallback(async () => {
        if (!slug) return;

        try {
            // Use RPC function for atomic increment
            const { error } = await supabase.rpc('increment_blog_view', {
                post_slug: slug
            });

            if (error) {
                console.warn('Error incrementing view:', error);
                return;
            }

            // Optimistically update local state
            setViewCount(prev => prev + 1);
        } catch (err) {
            console.error('Increment view error:', err);
        }
    }, [slug]);

    // Fetch on mount and increment view
    useEffect(() => {
        fetchViewCount();

        // Small delay to avoid counting rapid refreshes
        const timer = setTimeout(() => {
            incrementView();
        }, 2000);

        return () => clearTimeout(timer);
    }, [fetchViewCount, incrementView]);

    return { viewCount, isLoading };
};

// ============================================
// USE NEWSLETTER - Handle subscriptions
// ============================================

export const useNewsletter = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    const subscribe = async (email, name = null, source = 'blog') => {
        if (!email) {
            setError('Vui lòng nhập email');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email không hợp lệ');
            return false;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('newsletter_subscribers')
                .insert({
                    email: email.toLowerCase().trim(),
                    name,
                    source
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    // Unique constraint violation
                    setError('Email này đã đăng ký rồi!');
                } else {
                    throw insertError;
                }
                return false;
            }

            setIsSuccess(true);
            return true;
        } catch (err) {
            console.error('Newsletter subscription error:', err);
            setError('Có lỗi xảy ra, vui lòng thử lại sau');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setIsSuccess(false);
        setError(null);
    };

    return { subscribe, isSubmitting, isSuccess, error, reset };
};
