import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/auth-context';

/**
 * Hook for managing blog comments with Supabase
 * Features:
 * - Fetch comments with replies (nested structure)
 * - Create new comments and replies
 * - Delete own comments
 * - Like/unlike comments
 * - Real-time updates (optional)
 */
export const useComments = (postSlug, options = {}) => {
    const { enableRealtime = false } = options;

    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user, profile, isAuthenticated } = useAuth();

    // =========================================
    // FETCH COMMENTS
    // =========================================
    const fetchComments = useCallback(async () => {
        if (!postSlug) return;

        try {
            setIsLoading(true);
            setError(null);

            // Fetch all comments for this post
            const { data, error: fetchError } = await supabase
                .from('blog_comments')
                .select(`
                    id,
                    content,
                    parent_id,
                    likes_count,
                    created_at,
                    updated_at,
                    user_id,
                    users:user_id (
                        id,
                        full_name,
                        avatar_url,
                        roles:role_id (
                            code,
                            name
                        )
                    )
                `)
                .eq('post_slug', postSlug)
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Fetch user's likes if authenticated
            let userLikes = [];
            if (user?.id) {
                const { data: likesData } = await supabase
                    .from('blog_comment_likes')
                    .select('comment_id')
                    .eq('user_id', user.id);

                userLikes = likesData?.map(l => l.comment_id) || [];
            }

            // Transform to nested structure
            const commentsMap = new Map();
            const rootComments = [];

            // First pass: create all comment objects
            data?.forEach(comment => {
                const isOwner = user?.id === comment.user_id;
                const isLiked = userLikes.includes(comment.id);

                // Get badge based on role
                let badge = null;
                const roleCode = comment.users?.roles?.code;
                if (roleCode === 'SUPER_ADMIN') badge = 'Admin';
                else if (roleCode === 'CENTER_MANAGER') badge = 'Manager';
                else if (roleCode === 'TEACHER') badge = 'Giảng viên';

                const commentObj = {
                    id: comment.id,
                    author: {
                        name: comment.users?.full_name || 'Người dùng',
                        avatar: comment.users?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg',
                        badge
                    },
                    content: comment.content,
                    date: comment.created_at,
                    likes: comment.likes_count || 0,
                    isLiked,
                    isOwner,
                    parentId: comment.parent_id,
                    replies: []
                };

                commentsMap.set(comment.id, commentObj);
            });

            // Second pass: build nested structure
            commentsMap.forEach(comment => {
                if (comment.parentId) {
                    const parent = commentsMap.get(comment.parentId);
                    if (parent) {
                        parent.replies.push(comment);
                    }
                } else {
                    rootComments.push(comment);
                }
            });

            // Sort replies by date (oldest first for natural conversation flow)
            rootComments.forEach(comment => {
                comment.replies.sort((a, b) => new Date(a.date) - new Date(b.date));
            });

            setComments(rootComments);
        } catch (err) {
            console.error('[useComments] Fetch error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [postSlug, user?.id]);

    // =========================================
    // CREATE COMMENT
    // =========================================
    const createComment = useCallback(async (content, parentId = null) => {
        if (!isAuthenticated || !user?.id) {
            throw new Error('Bạn cần đăng nhập để bình luận');
        }

        if (!content?.trim()) {
            throw new Error('Nội dung bình luận không được để trống');
        }

        try {
            const { data, error: insertError } = await supabase
                .from('blog_comments')
                .insert({
                    post_slug: postSlug,
                    user_id: user.id,
                    parent_id: parentId,
                    content: content.trim()
                })
                .select(`
                    id,
                    content,
                    parent_id,
                    likes_count,
                    created_at,
                    user_id,
                    users:user_id (
                        id,
                        full_name,
                        avatar_url,
                        roles:role_id (
                            code,
                            name
                        )
                    )
                `)
                .single();

            if (insertError) throw insertError;

            // Create comment object
            let badge = null;
            const roleCode = data.users?.roles?.code;
            if (roleCode === 'SUPER_ADMIN') badge = 'Admin';
            else if (roleCode === 'CENTER_MANAGER') badge = 'Manager';
            else if (roleCode === 'TEACHER') badge = 'Giảng viên';

            const newComment = {
                id: data.id,
                author: {
                    name: data.users?.full_name || profile?.full_name || 'Bạn',
                    avatar: data.users?.avatar_url || profile?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg',
                    badge
                },
                content: data.content,
                date: data.created_at,
                likes: 0,
                isLiked: false,
                isOwner: true,
                parentId: data.parent_id,
                replies: []
            };

            // Update local state
            if (parentId) {
                // Add as reply
                setComments(prev => prev.map(comment =>
                    comment.id === parentId
                        ? { ...comment, replies: [...comment.replies, newComment] }
                        : comment
                ));
            } else {
                // Add as root comment
                setComments(prev => [newComment, ...prev]);
            }

            return newComment;
        } catch (err) {
            console.error('[useComments] Create error:', err);
            throw err;
        }
    }, [postSlug, user?.id, profile, isAuthenticated]);

    // =========================================
    // DELETE COMMENT
    // =========================================
    const deleteComment = useCallback(async (commentId, parentId = null) => {
        if (!isAuthenticated || !user?.id) {
            throw new Error('Bạn cần đăng nhập');
        }

        try {
            const { error: deleteError } = await supabase
                .from('blog_comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', user.id); // RLS will also enforce this

            if (deleteError) throw deleteError;

            // Update local state
            if (parentId) {
                // Remove reply
                setComments(prev => prev.map(comment =>
                    comment.id === parentId
                        ? { ...comment, replies: comment.replies.filter(r => r.id !== commentId) }
                        : comment
                ));
            } else {
                // Remove root comment
                setComments(prev => prev.filter(c => c.id !== commentId));
            }
        } catch (err) {
            console.error('[useComments] Delete error:', err);
            throw err;
        }
    }, [user?.id, isAuthenticated]);

    // =========================================
    // TOGGLE LIKE
    // =========================================
    const toggleLike = useCallback(async (commentId) => {
        if (!isAuthenticated || !user?.id) {
            throw new Error('Bạn cần đăng nhập để thích bình luận');
        }

        // Find the comment to check current like status
        let isCurrentlyLiked = false;
        let targetComment = comments.find(c => c.id === commentId);

        if (!targetComment) {
            // Check in replies
            for (const comment of comments) {
                const reply = comment.replies.find(r => r.id === commentId);
                if (reply) {
                    targetComment = reply;
                    break;
                }
            }
        }

        if (targetComment) {
            isCurrentlyLiked = targetComment.isLiked;
        }

        try {
            if (isCurrentlyLiked) {
                // Unlike
                const { error } = await supabase
                    .from('blog_comment_likes')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase
                    .from('blog_comment_likes')
                    .insert({
                        comment_id: commentId,
                        user_id: user.id
                    });

                if (error) throw error;
            }

            // Update local state
            const updateLikeStatus = (comment) => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        isLiked: !isCurrentlyLiked,
                        likes: isCurrentlyLiked ? comment.likes - 1 : comment.likes + 1
                    };
                }
                if (comment.replies?.length) {
                    return {
                        ...comment,
                        replies: comment.replies.map(updateLikeStatus)
                    };
                }
                return comment;
            };

            setComments(prev => prev.map(updateLikeStatus));
        } catch (err) {
            console.error('[useComments] Toggle like error:', err);
            throw err;
        }
    }, [comments, user?.id, isAuthenticated]);

    // =========================================
    // REAL-TIME SUBSCRIPTION (optional)
    // =========================================
    useEffect(() => {
        if (!enableRealtime || !postSlug) return;

        const channel = supabase
            .channel(`comments:${postSlug}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'blog_comments',
                    filter: `post_slug=eq.${postSlug}`
                },
                () => {
                    // Refetch on any change
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [enableRealtime, postSlug, fetchComments]);

    // =========================================
    // INITIAL FETCH
    // =========================================
    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // =========================================
    // COMPUTED VALUES
    // =========================================
    const totalCount = comments.reduce(
        (acc, c) => acc + 1 + (c.replies?.length || 0),
        0
    );

    return {
        comments,
        isLoading,
        error,
        totalCount,

        // Actions
        createComment,
        deleteComment,
        toggleLike,
        refetch: fetchComments,

        // Auth info for UI
        isAuthenticated,
        currentUser: {
            id: user?.id,
            name: profile?.full_name || 'Khách',
            avatar: profile?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'
        }
    };
};

export default useComments;
