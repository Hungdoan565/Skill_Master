/**
 * DocumentsPage - Trang quản lý tài liệu & học liệu
 * 
 * Features:
 * - Danh sách tài liệu theo khóa học/lớp
 * - Upload tài liệu mới
 * - Phân loại: Bài giảng, Bài tập, Đề thi, Video...
 * - Download tracking
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    FileText,
    Upload,
    Search,
    Filter,
    MoreVertical,
    Download,
    Trash2,
    Edit2,
    Eye,
    FolderOpen,
    BookOpen,
    Video,
    File,
    Plus,
    RefreshCw,
    Loader2,
    X,
    Building2,
    Play,
    TrendingUp,
    Users,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { useDocuments } from '../hooks';
import {
    DOCUMENT_TYPES,
    getDocTypeConfig,
    formatFileSize,
    formatDate,
    getFileIcon,
    isVideoDocument,
    isYouTubeUrl,
    isVimeoUrl,
    getVideoEmbedUrl,
    isVideoFile,
} from '../utils';

// Type icon mapping
const TypeIcons = {
    lesson: BookOpen,
    exercise: FileText,
    exam: FileText,
    material: File,
    video: Video,
    other: FolderOpen,
};

// Stats Card
const StatsCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    </div>
);

// Document Card
const DocumentCard = ({ document, onDownload, onEdit, onDelete, onPreview, onViewAnalytics }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const typeConfig = getDocTypeConfig(document.type);
    const TypeIcon = TypeIcons[document.type] || File;
    const isVideo = isVideoDocument(document);

    return (
        <div className="bg-white border rounded-lg hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2.5 rounded-lg ${typeConfig.color} relative`}>
                            <TypeIcon className="h-5 w-5" />
                            {isVideo && (
                                <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-0.5">
                                    <Play className="h-2.5 w-2.5 text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 truncate">{document.title}</h3>
                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{document.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                <span>{document.courses?.title || 'Chung'}</span>
                                <span>•</span>
                                <span>{formatFileSize(document.file_size)}</span>
                                <span>•</span>
                                <span>{document.download_count || 0} lượt tải</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="relative ml-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        {menuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border z-20">
                                    {isVideo && (
                                        <button
                                            onClick={() => { onPreview(document); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-pink-600 hover:bg-pink-50"
                                        >
                                            <Play className="h-4 w-4" />
                                            Xem video
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { onDownload(document); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Download className="h-4 w-4" />
                                        {isVideo && (isYouTubeUrl(document.file_url) || isVimeoUrl(document.file_url))
                                            ? 'Mở link gốc'
                                            : 'Tải xuống'
                                        }
                                    </button>
                                    <button
                                        onClick={() => { onViewAnalytics(document); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                    >
                                        <BarChart3 className="h-4 w-4" />
                                        Thống kê
                                    </button>
                                    <button
                                        onClick={() => { onEdit(document); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Chỉnh sửa
                                    </button>
                                    <button
                                        onClick={() => { onDelete(document); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Xóa
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t flex items-center justify-between text-xs text-slate-500">
                <span>Tải lên: {formatDate(document.created_at)}</span>
                <span>Bởi: {document.uploaded_by_user?.full_name || 'N/A'}</span>
            </div>
        </div>
    );
};

// Analytics Modal
const AnalyticsModal = ({ isOpen, onClose, document }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && document?.id) {
            fetchAnalytics();
        }
    }, [isOpen, document?.id]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/documents/${document.id}/analytics`,
                {
                    headers: {
                        'Authorization': `Bearer ${(await (await import('@/lib/supabaseClient')).supabase.auth.getSession()).data.session?.access_token}`
                    }
                }
            );
            const result = await response.json();
            if (result.success) {
                setAnalytics(result.data);
            }
        } catch (err) {
            console.error('Fetch analytics error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !document) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-white rounded-xl w-full max-w-3xl mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Thống kê tài liệu</h2>
                            <p className="text-sm text-slate-500">{document.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : analytics ? (
                        <div className="space-y-6">
                            {/* Document Info */}
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Tên file:</span>
                                        <p className="font-medium text-slate-900 mt-1">{analytics.document?.file_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Loại:</span>
                                        <p className="font-medium text-slate-900 mt-1 capitalize">{analytics.document?.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Kích thước:</span>
                                        <p className="font-medium text-slate-900 mt-1">{formatFileSize(analytics.document?.file_size)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Tải lên:</span>
                                        <p className="font-medium text-slate-900 mt-1">{formatDate(analytics.document?.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
                                        <Download className="h-4 w-4" />
                                        Tổng tải
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {analytics.stats?.total_downloads || analytics.document?.download_count || 0}
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-1">
                                        <Users className="h-4 w-4" />
                                        Người dùng
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {analytics.stats?.unique_users || 0}
                                    </div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-purple-600 text-sm font-medium mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        Tháng này
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {analytics.stats?.downloads_this_month || 0}
                                    </div>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-orange-600 text-sm font-medium mb-1">
                                        <TrendingUp className="h-4 w-4" />
                                        Tuần này
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {analytics.stats?.downloads_this_week || 0}
                                    </div>
                                </div>
                            </div>

                            {/* No downloads message */}
                            {(!analytics.recent_downloads || analytics.recent_downloads.length === 0) && (
                                <div className="text-center py-8 bg-slate-50 rounded-lg">
                                    <Download className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-medium">Chưa có lượt tải xuống</p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        Thống kê sẽ hiển thị sau khi có người tải tài liệu này
                                    </p>
                                </div>
                            )}

                            {/* Top Downloader */}
                            {analytics.stats?.top_downloader_name && (
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-slate-600 mb-1">
                                                Người tải nhiều nhất
                                            </div>
                                            <div className="text-lg font-semibold text-slate-900">
                                                {analytics.stats.top_downloader_name}
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-blue-600">
                                            {analytics.stats.top_downloader_count}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Downloads */}
                            {analytics.recent_downloads && analytics.recent_downloads.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                                        Lịch sử tải xuống gần đây
                                    </h3>
                                    <div className="space-y-2">
                                        {analytics.recent_downloads.map((dl, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                                        {dl.users?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">
                                                            {dl.users?.full_name || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {dl.users?.role === 'teacher' ? 'Giáo viên' :
                                                                dl.users?.role === 'student' ? 'Học viên' :
                                                                    dl.users?.role || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {formatDate(dl.downloaded_at)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            Không có dữ liệu thống kê
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        💡 Tip: Click "Tải xuống" trên tài liệu để tracking được ghi nhận
                    </div>
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Video Preview Modal
const VideoPreviewModal = ({ isOpen, onClose, document }) => {
    if (!isOpen || !document) return null;

    const embedUrl = getVideoEmbedUrl(document.file_url);
    const isDirectVideo = isVideoFile(document.file_name) && !embedUrl;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-white rounded-xl w-full max-w-4xl mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">{document.title}</h2>
                        <p className="text-sm text-slate-500">{document.description}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="aspect-video bg-black">
                    {embedUrl ? (
                        // YouTube/Vimeo embed
                        <iframe
                            src={embedUrl}
                            title={document.title}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : isDirectVideo ? (
                        // Direct video file
                        <video
                            src={document.file_url}
                            controls
                            className="w-full h-full"
                            controlsList="nodownload"
                        >
                            Trình duyệt không hỗ trợ video.
                        </video>
                    ) : (
                        // Fallback - open in new tab
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-white">
                                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="mb-4">Không thể xem trước video này</p>
                                <Button
                                    onClick={() => window.open(document.file_url, '_blank')}
                                    variant="secondary"
                                >
                                    Mở trong tab mới
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-50 flex justify-between items-center">
                    <span className="text-sm text-slate-500">
                        {isYouTubeUrl(document.file_url) && '📺 YouTube'}
                        {isVimeoUrl(document.file_url) && '📺 Vimeo'}
                        {isDirectVideo && `📁 ${formatFileSize(document.file_size)}`}
                    </span>
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Upload Modal
const UploadModal = ({ isOpen, onClose, courses, classes, onSubmit, submitting }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'lesson',
        course_id: '',
        class_id: '',
    });
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(formData, file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Tải lên tài liệu mới</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Nhập tiêu đề tài liệu"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Mô tả ngắn về tài liệu"
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Loại tài liệu</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {DOCUMENT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Course */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Khóa học</label>
                        <select
                            value={formData.course_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tài liệu chung</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* File */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tệp tin <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="file-upload"
                                required
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600">
                                    {file ? file.name : 'Nhấp để chọn tệp hoặc kéo thả vào đây'}
                                </p>
                                {file && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        {formatFileSize(file.size)}
                                    </p>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={submitting || !formData.title || !file}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang tải lên...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Tải lên
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Modal
const EditModal = ({ isOpen, onClose, document, onSubmit, submitting }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'lesson'
    });

    useEffect(() => {
        if (document) {
            setFormData({
                title: document.title || '',
                description: document.description || '',
                type: document.type || 'lesson'
            });
        }
    }, [document]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-2xl mx-4 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Chỉnh sửa tài liệu</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tiêu đề <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Nhập tiêu đề tài liệu"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Mô tả
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Mô tả về tài liệu..."
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Loại tài liệu
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {DOCUMENT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* File info */}
                    <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                        <p className="font-medium mb-1">File hiện tại:</p>
                        <p className="text-slate-500">{document?.file_name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Lưu ý: Không thể thay đổi file. Để upload file mới, vui lòng tạo tài liệu mới.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={submitting || !formData.title}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                'Lưu thay đổi'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export function DocumentsPage() {
    const { isManager, getCenterId, isSuperAdmin } = useAuth();
    const { showToast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [centers, setCenters] = useState([]);
    const [uploadModal, setUploadModal] = useState(false);
    const [editModal, setEditModal] = useState({ isOpen: false, document: null });
    const [submitting, setSubmitting] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, document: null });
    const [videoPreview, setVideoPreview] = useState({ isOpen: false, document: null });
    const [analyticsModal, setAnalyticsModal] = useState({ isOpen: false, document: null });

    const {
        documents,
        courses,
        classes,
        loading,
        fetchDocuments,
        fetchCourses,
        fetchClasses,
        uploadDocument,
        updateDocument,
        deleteDocument,
        filterDocuments,
    } = useDocuments();

    // Effective center ID
    const effectiveCenterId = useMemo(() => {
        if (isSuperAdmin()) {
            return selectedCenter || null;
        }
        return getCenterId();
    }, [isSuperAdmin, selectedCenter, getCenterId]);

    // Fetch centers for SUPER_ADMIN
    useEffect(() => {
        if (isSuperAdmin()) {
            const fetchCentersData = async () => {
                try {
                    const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/centers`,
                        { headers: { Authorization: `Bearer ${session?.access_token}` } }
                    );
                    const result = await response.json();
                    if (result.success) {
                        setCenters(result.data || []);
                    }
                } catch (err) {
                    console.error('Error fetching centers:', err);
                }
            };
            fetchCentersData();
        }
    }, [isSuperAdmin]);

    // Fetch data
    useEffect(() => {
        fetchDocuments({
            type: typeFilter,
            courseId: courseFilter,
            centerId: effectiveCenterId,
        });
        fetchCourses(effectiveCenterId);
        fetchClasses(effectiveCenterId);
    }, [fetchDocuments, fetchCourses, fetchClasses, typeFilter, courseFilter, effectiveCenterId]);

    // Filter documents locally
    const filteredDocuments = filterDocuments(searchTerm);

    // Stats
    const stats = useMemo(() => {
        const byType = {};
        DOCUMENT_TYPES.forEach(t => { byType[t.value] = 0; });
        documents.forEach(d => { byType[d.type] = (byType[d.type] || 0) + 1; });
        return {
            total: documents.length,
            lessons: byType.lesson || 0,
            exercises: byType.exercise || 0,
            videos: byType.video || 0,
        };
    }, [documents]);

    // Handle upload
    const handleUpload = async (formData, file) => {
        setSubmitting(true);
        try {
            await uploadDocument({ ...formData, center_id: effectiveCenterId }, file);
            showToast('Tải lên tài liệu thành công', 'success');
            setUploadModal(false);
            fetchDocuments({ type: typeFilter, courseId: courseFilter, centerId: effectiveCenterId });
        } catch (err) {
            console.error('Error uploading:', err);
            showToast(err.message || 'Có lỗi xảy ra khi tải lên tài liệu', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle download with tracking
    const handleDownload = async (doc) => {
        if (!doc.file_url || doc.file_url === '#') {
            showToast('File không tồn tại', 'error');
            return;
        }

        try {
            // Track download first
            const trackResponse = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/documents/${doc.id}/download`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${(await (await import('@/lib/supabaseClient')).supabase.auth.getSession()).data.session?.access_token}`
                    }
                }
            );

            const trackResult = await trackResponse.json();
            console.log('Track download response:', trackResult);

            if (!trackResult.success) {
                console.error('Track failed:', trackResult);
            }

            // Fetch file as blob to force download
            showToast('Đang tải xuống...', 'info');

            const response = await fetch(doc.file_url);
            const blob = await response.blob();

            // Create blob URL and trigger download
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = doc.file_name || 'download';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            showToast('Đã tải xuống thành công', 'success');

            // Refresh list immediately to update download count
            await fetchDocuments({ type: typeFilter, courseId: courseFilter, centerId: effectiveCenterId });
        } catch (err) {
            console.error('Download error:', err);
            showToast('Lỗi khi tải xuống, thử mở trong tab mới', 'error');
            // Fallback: open in new tab
            window.open(doc.file_url, '_blank');
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteModal.document) return;
        try {
            await deleteDocument(deleteModal.document.id);
            setDeleteModal({ isOpen: false, document: null });
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    // Handle edit
    const handleEdit = (doc) => {
        setEditModal({ isOpen: true, document: doc });
    };

    // Handle edit submit
    const handleEditSubmit = async (formData) => {
        if (!editModal.document) return;
        try {
            setSubmitting(true);
            await updateDocument(editModal.document.id, formData);
            showToast('Đã cập nhật tài liệu', 'success');
            setEditModal({ isOpen: false, document: null });
            await fetchDocuments({ type: typeFilter, courseId: courseFilter, centerId: effectiveCenterId });
        } catch (err) {
            console.error('Error updating:', err);
            showToast(err.message || 'Không thể cập nhật tài liệu', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Tài liệu</h1>
                    <p className="text-slate-500">Tài liệu và học liệu cho các khóa học</p>
                </div>
                <Button onClick={() => setUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Tải lên
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard icon={FolderOpen} label="Tổng tài liệu" value={stats.total} color="bg-indigo-500" />
                <StatsCard icon={BookOpen} label="Bài giảng" value={stats.lessons} color="bg-blue-500" />
                <StatsCard icon={FileText} label="Bài tập" value={stats.exercises} color="bg-green-500" />
                <StatsCard icon={Video} label="Video" value={stats.videos} color="bg-pink-500" />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm tài liệu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả loại</option>
                            {DOCUMENT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>

                        {/* Course Filter */}
                        <select
                            value={courseFilter}
                            onChange={(e) => setCourseFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả khóa học</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>

                        {/* Center Filter for SUPER_ADMIN */}
                        {isSuperAdmin() && centers.length > 0 && (
                            <select
                                value={selectedCenter}
                                onChange={(e) => setSelectedCenter(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Tất cả trung tâm</option>
                                {centers.map(center => (
                                    <option key={center.id} value={center.id}>{center.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Refresh */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchDocuments({ type: typeFilter, courseId: courseFilter, centerId: effectiveCenterId })}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : filteredDocuments.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FolderOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500">Chưa có tài liệu nào</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => setUploadModal(true)}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Tải lên tài liệu đầu tiên
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map(doc => (
                        <DocumentCard
                            key={doc.id}
                            document={doc}
                            onDownload={handleDownload}
                            onEdit={handleEdit}
                            onDelete={(d) => setDeleteModal({ isOpen: true, document: d })}
                            onPreview={(d) => setVideoPreview({ isOpen: true, document: d })}
                            onViewAnalytics={(d) => setAnalyticsModal({ isOpen: true, document: d })}
                        />
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            <UploadModal
                isOpen={uploadModal}
                onClose={() => setUploadModal(false)}
                courses={courses}
                classes={classes}
                onSubmit={handleUpload}
                submitting={submitting}
            />

            {/* Edit Modal */}
            <EditModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, document: null })}
                document={editModal.document}
                onSubmit={handleEditSubmit}
                submitting={submitting}
            />

            {/* Video Preview Modal */}
            <VideoPreviewModal
                isOpen={videoPreview.isOpen}
                onClose={() => setVideoPreview({ isOpen: false, document: null })}
                document={videoPreview.document}
            />

            <AnalyticsModal
                isOpen={analyticsModal.isOpen}
                onClose={() => setAnalyticsModal({ isOpen: false, document: null })}
                document={analyticsModal.document}
            />

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-900">Xác nhận xóa</h3>
                        <p className="text-slate-500 mt-2">
                            Bạn có chắc muốn xóa tài liệu <strong>{deleteModal.document?.title}</strong>?
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteModal({ isOpen: false, document: null })}
                            >
                                Hủy
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Xóa
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DocumentsPage;
