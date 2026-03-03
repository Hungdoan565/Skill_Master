import { gooeyToast } from 'goey-toast';
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    MessageCircle,
    Heart,
    Reply,
    MoreHorizontal,
    Send,
    Smile,
    Flag,
    Trash2,
    ChevronDown,
    ChevronUp,
    Check,
    AlertTriangle,
    X,
    Loader2
} from 'lucide-react';
import { useComments } from '../hooks/useComments';

// ============================================
// DEFAULT AVATAR (fallback)
// ============================================
const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/lego/1.jpg';

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 
                animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 
                        transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Warning Icon */}
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center 
                        mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">
                        Xóa bình luận?
                    </h3>

                    {/* Description */}
                    <p className="text-zinc-600 text-sm mb-6">
                        Bạn có chắc chắn muốn xóa bình luận này không?
                        Hành động này không thể hoàn tác.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 bg-stone-100 text-zinc-700 font-medium 
                                rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium 
                                rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50
                                flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Xóa
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// REPORT MODAL
// ============================================
const REPORT_REASONS = [
    { id: 'spam', label: 'Spam hoặc quảng cáo' },
    { id: 'harassment', label: 'Quấy rối hoặc bắt nạt' },
    { id: 'hate_speech', label: 'Ngôn từ thù địch' },
    { id: 'misinformation', label: 'Thông tin sai lệch' },
    { id: 'inappropriate', label: 'Nội dung không phù hợp' },
    { id: 'other', label: 'Lý do khác' }
];

const ReportModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedReason) return;
        onSubmit(selectedReason, additionalInfo);
        setSelectedReason('');
        setAdditionalInfo('');
    };

    const handleClose = () => {
        setSelectedReason('');
        setAdditionalInfo('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 
                animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 
                        transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                            <Flag className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900">
                                Báo cáo bình luận
                            </h3>
                            <p className="text-sm text-zinc-500">
                                Chọn lý do báo cáo
                            </p>
                        </div>
                    </div>

                    {/* Reasons */}
                    <div className="space-y-2 mb-4">
                        {REPORT_REASONS.map(reason => (
                            <label
                                key={reason.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
                                    transition-all duration-200
                                    ${selectedReason === reason.id
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="reportReason"
                                    value={reason.id}
                                    checked={selectedReason === reason.id}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                />
                                <span className={`text-sm ${selectedReason === reason.id ? 'font-medium text-red-700' : 'text-zinc-700'}`}>
                                    {reason.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Additional Info */}
                    {selectedReason === 'other' && (
                        <textarea
                            value={additionalInfo}
                            onChange={(e) => setAdditionalInfo(e.target.value)}
                            placeholder="Vui lòng mô tả chi tiết..."
                            rows={3}
                            className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm
                                border border-stone-200 focus:outline-none focus:border-red-300
                                focus:ring-2 focus:ring-red-500/10 resize-none mb-4"
                        />
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-stone-100 text-zinc-700 font-medium 
                                rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedReason || isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium 
                                rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50
                                flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Flag className="w-4 h-4" />
                                    Gửi báo cáo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// CUSTOM SORT DROPDOWN
// ============================================
const SortDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const options = [
        { id: 'newest', label: 'Mới nhất' },
        { id: 'popular', label: 'Phổ biến nhất' }
    ];

    const selectedOption = options.find(o => o.id === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-lg
                    text-sm text-zinc-600 hover:bg-stone-200 transition-colors"
            >
                <span>{selectedOption?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute right-0 top-full mt-1 w-40 bg-white rounded-lg
                shadow-lg border border-stone-200 py-1 z-20 transition-all duration-200
                ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
                {options.map(option => (
                    <button
                        key={option.id}
                        onClick={() => {
                            onChange(option.id);
                            setIsOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between
                            ${value === option.id
                                ? 'bg-red-50 text-red-600 font-medium'
                                : 'text-zinc-600 hover:bg-stone-50'
                            }`}
                    >
                        {option.label}
                        {value === option.id && <Check className="w-4 h-4" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================
// SINGLE COMMENT COMPONENT
// ============================================
const Comment = ({
    comment,
    isReply = false,
    onReply,
    onRequestDelete,
    onRequestReport,
    onToggleLike,
    parentId,
    currentUserAvatar
}) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showReplies, setShowReplies] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLike = async () => {
        try {
            await onToggleLike(comment.id);
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    const handleSubmitReply = async () => {
        if (!replyText.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onReply(replyText, comment.id);
            setReplyText('');
            setShowReplyInput(false);
        } catch (err) {
            console.error('Reply error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitReply();
        }
    };

    const handleDeleteClick = () => {
        if (isReply && parentId) {
            onRequestDelete(comment.id, parentId);
        } else {
            onRequestDelete(comment.id);
        }
        setShowMenu(false);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className={`${isReply ? 'ml-12 mt-4' : ''}`}>
            <div className="flex gap-3">
                {/* Avatar */}
                <img
                    src={comment.author.avatar || DEFAULT_AVATAR}
                    alt={comment.author.name}
                    className={`rounded-full object-cover flex-shrink-0 
                        ${isReply ? 'w-8 h-8' : 'w-10 h-10'}`}
                    onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 text-sm">
                            {comment.author.name}
                        </span>
                        {comment.isOwner && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                                Bạn
                            </span>
                        )}
                        {comment.author.badge && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 
                                text-amber-700 text-xs font-medium rounded-full">
                                {comment.author.badge}
                            </span>
                        )}
                        <span className="text-xs text-zinc-400">
                            {formatDate(comment.date)}
                        </span>
                    </div>

                    {/* Comment text */}
                    <p className="text-sm text-zinc-700 mt-1 leading-relaxed">
                        {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                        {/* Like */}
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1 text-xs transition-colors
                                ${comment.isLiked
                                    ? 'text-red-500 font-medium'
                                    : 'text-zinc-400 hover:text-red-500'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes}</span>
                        </button>

                        {/* Reply */}
                        {!isReply && (
                            <button
                                onClick={() => setShowReplyInput(!showReplyInput)}
                                className="flex items-center gap-1 text-xs text-zinc-400 
                                    hover:text-blue-500 transition-colors"
                            >
                                <Reply className="w-4 h-4" />
                                <span>Trả lời</span>
                            </button>
                        )}

                        {/* More menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {showMenu && (
                                <div className="absolute left-0 top-full mt-1 w-36 bg-white 
                                    rounded-xl shadow-lg border border-stone-200 py-1 z-20">
                                    {comment.isOwner && (
                                        <button
                                            onClick={handleDeleteClick}
                                            className="w-full px-3 py-2 text-left text-xs text-red-600 
                                                hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Xóa bình luận
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            onRequestReport(comment.id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-xs text-zinc-600 
                                            hover:bg-stone-50 flex items-center gap-2"
                                    >
                                        <Flag className="w-3 h-3" />
                                        Báo cáo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reply Input */}
                    {showReplyInput && (
                        <div className="flex gap-2 mt-3">
                            <img
                                src={currentUserAvatar || DEFAULT_AVATAR}
                                alt="Your avatar"
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                            />
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Viết phản hồi..."
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-stone-100 rounded-full text-sm
                                    border-0 focus:outline-none focus:ring-2 focus:ring-red-500/20
                                    disabled:opacity-50"
                            />
                            <button
                                onClick={handleSubmitReply}
                                disabled={!replyText.trim() || isSubmitting}
                                className="w-9 h-9 bg-red-600 text-white rounded-full 
                                    flex items-center justify-center hover:bg-red-700 transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Replies */}
                    {!isReply && comment.replies?.length > 0 && (
                        <div className="mt-3">
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="flex items-center gap-1 text-xs text-blue-600 
                                    hover:text-blue-700 font-medium"
                            >
                                {showReplies ? (
                                    <>
                                        <ChevronUp className="w-4 h-4" />
                                        Ẩn {comment.replies.length} phản hồi
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" />
                                        Xem {comment.replies.length} phản hồi
                                    </>
                                )}
                            </button>

                            {showReplies && (
                                <div className="mt-2">
                                    {comment.replies.map(reply => (
                                        <Comment
                                            key={reply.id}
                                            comment={reply}
                                            isReply
                                            onRequestDelete={onRequestDelete}
                                            onToggleLike={onToggleLike}
                                            parentId={comment.id}
                                            currentUserAvatar={currentUserAvatar}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// LOADING SKELETON
// ============================================
const CommentSkeleton = () => (
    <div className="animate-pulse">
        {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 mb-6">
                <div className="w-10 h-10 bg-stone-200 rounded-full" />
                <div className="flex-1">
                    <div className="h-4 bg-stone-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-stone-200 rounded w-full mb-1" />
                    <div className="h-3 bg-stone-200 rounded w-3/4" />
                </div>
            </div>
        ))}
    </div>
);

// ============================================
// COMMENTS SECTION (Main Component)
// ============================================
export const CommentsSection = ({ postSlug }) => {
    const [newComment, setNewComment] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete modal state
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        commentId: null,
        parentId: null
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Report modal state
    const [reportModal, setReportModal] = useState({
        isOpen: false,
        commentId: null
    });
    const [isReporting, setIsReporting] = useState(false);

    // Use Supabase comments hook
    const {
        comments,
        isLoading,
        error,
        totalCount,
        createComment,
        deleteComment,
        toggleLike,
        isAuthenticated,
        currentUser
    } = useComments(postSlug);

    // Sort comments
    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === 'popular') {
            return b.likes - a.likes;
        }
        return new Date(b.date) - new Date(a.date);
    });

    // Submit new comment
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await createComment(newComment);
            setNewComment('');
        } catch (err) {
            console.error('Submit error:', err);
            gooeyToast(err.message || 'Có lỗi xảy ra');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit reply
    const handleReply = async (content, parentId) => {
        await createComment(content, parentId);
    };

    // Request delete
    const handleRequestDelete = (commentId, parentId = null) => {
        setDeleteModal({
            isOpen: true,
            commentId,
            parentId
        });
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteComment(deleteModal.commentId, deleteModal.parentId);
            setDeleteModal({ isOpen: false, commentId: null, parentId: null });
        } catch (err) {
            console.error('Delete error:', err);
            gooeyToast(err.message || 'Có lỗi xảy ra');
        } finally {
            setIsDeleting(false);
        }
    };

    // Close delete modal
    const handleCloseDeleteModal = () => {
        if (!isDeleting) {
            setDeleteModal({ isOpen: false, commentId: null, parentId: null });
        }
    };

    // Request report
    const handleRequestReport = (commentId) => {
        setReportModal({
            isOpen: true,
            commentId
        });
    };

    // Submit report
    const handleSubmitReport = async (reason, additionalInfo) => {
        try {
            setIsReporting(true);

            if (!isAuthenticated) {
                gooeyToast.warning('Vui lòng đăng nhập để gửi báo cáo!');
                return;
            }

            const { error: reportError } = await supabase
                .from('blog_comment_reports')
                .insert({
                    comment_id: reportModal.commentId,
                    user_id: currentUser.id,
                    reason,
                    additional_info: additionalInfo
                });

            if (reportError) throw reportError;

            setReportModal({ isOpen: false, commentId: null });
            gooeyToast('✅ Cảm ơn bạn! Báo cáo của bạn đã được gửi cho ban quản trị.');
        } catch (err) {
            console.error('Report error:', err);
            gooeyToast('Có lỗi xảy ra: ' + (err.message || 'Không thể gửi báo cáo'));
        } finally {
            setIsReporting(false);
        }
    };

    // Close report modal
    const handleCloseReportModal = () => {
        if (!isReporting) {
            setReportModal({ isOpen: false, commentId: null });
        }
    };

    return (
        <section className="py-12 border-t border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-zinc-900" />
                    <h2 className="text-xl font-bold text-zinc-900">
                        Bình luận
                        <span className="ml-2 text-base font-normal text-zinc-400">
                            ({totalCount})
                        </span>
                    </h2>
                </div>

                {/* Custom Sort Dropdown */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Sắp xếp:</span>
                    <SortDropdown value={sortBy} onChange={setSortBy} />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* New Comment Input */}
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-3">
                    <img
                        src={currentUser.avatar}
                        alt="Your avatar"
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={isAuthenticated
                                ? "Chia sẻ suy nghĩ của bạn về bài viết này..."
                                : "Đăng nhập để bình luận..."
                            }
                            rows={3}
                            disabled={!isAuthenticated || isSubmitting}
                            className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm
                                border border-stone-200 focus:outline-none focus:border-red-300
                                focus:ring-2 focus:ring-red-500/10 resize-none
                                disabled:bg-stone-100 disabled:cursor-not-allowed"
                        />
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={!newComment.trim() || !isAuthenticated || isSubmitting}
                                className="px-5 py-2 bg-red-600 text-white text-sm font-medium 
                                    rounded-full hover:bg-red-700 transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Gửi bình luận
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Loading State */}
            {isLoading && <CommentSkeleton />}

            {/* Comments List */}
            {!isLoading && (
                <div className="space-y-6">
                    {sortedComments.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        sortedComments.map(comment => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                onReply={handleReply}
                                onRequestDelete={handleRequestDelete}
                                onRequestReport={handleRequestReport}
                                onToggleLike={toggleLike}
                                currentUserAvatar={currentUser.avatar}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />

            {/* Report Modal */}
            <ReportModal
                isOpen={reportModal.isOpen}
                onClose={handleCloseReportModal}
                onSubmit={handleSubmitReport}
                isSubmitting={isReporting}
            />
        </section>
    );
};

export default CommentsSection;
