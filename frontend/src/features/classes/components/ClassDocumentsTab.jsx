/**
 * ClassDocumentsTab Component
 * Manages documents for a specific class
 * 
 * Features:
 * - List documents attached to class
 * - Upload new documents (PDF, Word, Excel, Video links)
 * - Download/Preview documents
 * - Delete documents
 * - Link to course materials
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FileText,
    Upload,
    Download,
    Trash2,
    Eye,
    Plus,
    Search,
    FolderOpen,
    BookOpen,
    Video,
    File,
    Loader2,
    MoreVertical,
    ExternalLink,
    Link as LinkIcon,
    Play,
    FileImage,
    FileSpreadsheet,
    FileType,
    X,
    Check,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Document type configuration
const DOC_TYPES = {
    lesson: { label: 'Bài giảng', color: 'bg-blue-100 text-blue-700', icon: BookOpen },
    exercise: { label: 'Bài tập', color: 'bg-green-100 text-green-700', icon: FileText },
    material: { label: 'Tài liệu', color: 'bg-purple-100 text-purple-700', icon: File },
    video: { label: 'Video', color: 'bg-pink-100 text-pink-700', icon: Video },
    other: { label: 'Khác', color: 'bg-slate-100 text-slate-700', icon: FolderOpen }
};

// File icon mapping
const getFileTypeIcon = (fileName) => {
    if (!fileName) return File;
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf': return FileType;
        case 'doc':
        case 'docx': return FileText;
        case 'xls':
        case 'xlsx': return FileSpreadsheet;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return FileImage;
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'webm': return Video;
        default: return File;
    }
};

// Format file size
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export function ClassDocumentsTab({ classId, className, courseId, getHeaders }) {
    // State
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Fetch documents for this class
    const fetchDocuments = useCallback(async () => {
        if (!classId) return;

        setLoading(true);
        try {
            const headers = getHeaders();
            const response = await fetch(
                `${API_URL}/api/admin/classes/${classId}/documents`,
                { headers }
            );
            const json = await response.json();

            if (json.success) {
                setDocuments(json.data || []);
            }
        } catch (error) {
            console.error('Error fetching class documents:', error);
        } finally {
            setLoading(false);
        }
    }, [classId, getHeaders]);

    // Initial fetch
    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Filtered documents
    const filteredDocuments = useMemo(() => {
        let result = documents;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(doc =>
                doc.title?.toLowerCase().includes(term) ||
                doc.description?.toLowerCase().includes(term) ||
                doc.file_name?.toLowerCase().includes(term)
            );
        }

        // Filter by type
        if (typeFilter !== 'all') {
            result = result.filter(doc => doc.type === typeFilter);
        }

        return result;
    }, [documents, searchTerm, typeFilter]);

    // Handle download
    const handleDownload = async (doc) => {
        try {
            if (doc.file_url) {
                // Track download
                const headers = getHeaders();
                await fetch(
                    `${API_URL}/api/admin/documents/${doc.id}/download`,
                    { method: 'POST', headers }
                ).catch(() => { });

                // Open file
                window.open(doc.file_url, '_blank');
            }
        } catch (error) {
            console.error('Error downloading:', error);
        }
    };

    // Handle delete
    const handleDelete = async (doc) => {
        if (!window.confirm(`Bạn có chắc muốn xóa "${doc.title}"?`)) return;

        try {
            const headers = getHeaders();
            const response = await fetch(
                `${API_URL}/api/admin/documents/${doc.id}`,
                { method: 'DELETE', headers }
            );

            if (response.ok) {
                setDocuments(prev => prev.filter(d => d.id !== doc.id));
            }
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    // Handle preview
    const handlePreview = (doc) => {
        setSelectedDoc(doc);
        setShowPreviewModal(true);
    };

    // Group documents by type
    const groupedDocuments = useMemo(() => {
        const groups = {};
        filteredDocuments.forEach(doc => {
            const type = doc.type || 'other';
            if (!groups[type]) groups[type] = [];
            groups[type].push(doc);
        });
        return groups;
    }, [filteredDocuments]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Tài liệu lớp học</h3>
                    <p className="text-sm text-slate-500">
                        {documents.length} tài liệu • {className}
                    </p>
                </div>

                <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm tài liệu
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm tài liệu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Type filter */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'all'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Tất cả
                    </button>
                    {Object.entries(DOC_TYPES).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setTypeFilter(key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === key
                                ? config.color
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {config.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Đang tải tài liệu...</p>
                </div>
            ) : filteredDocuments.length === 0 ? (
                <EmptyState
                    searchTerm={searchTerm}
                    onUpload={() => setShowUploadModal(true)}
                />
            ) : (
                <DocumentsList
                    documents={filteredDocuments}
                    onDownload={handleDownload}
                    onPreview={handlePreview}
                    onDelete={handleDelete}
                />
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <UploadModal
                    classId={classId}
                    courseId={courseId}
                    getHeaders={getHeaders}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        fetchDocuments();
                    }}
                />
            )}

            {/* Preview Modal */}
            {showPreviewModal && selectedDoc && (
                <PreviewModal
                    document={selectedDoc}
                    onClose={() => {
                        setShowPreviewModal(false);
                        setSelectedDoc(null);
                    }}
                />
            )}
        </div>
    );
}

// Empty state component
function EmptyState({ searchTerm, onUpload }) {
    return (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            {searchTerm ? (
                <>
                    <p className="text-slate-500">Không tìm thấy tài liệu phù hợp</p>
                    <p className="text-sm text-slate-400 mt-1">Thử tìm với từ khóa khác</p>
                </>
            ) : (
                <>
                    <p className="text-slate-500">Chưa có tài liệu nào</p>
                    <p className="text-sm text-slate-400 mt-1">Thêm bài giảng, bài tập hoặc tài liệu cho lớp học</p>
                    <Button onClick={onUpload} className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm tài liệu đầu tiên
                    </Button>
                </>
            )}
        </div>
    );
}

// Documents list component
function DocumentsList({ documents, onDownload, onPreview, onDelete }) {
    return (
        <div className="grid gap-3">
            {documents.map((doc) => (
                <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDownload={onDownload}
                    onPreview={onPreview}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

// Document card component
function DocumentCard({ document, onDownload, onPreview, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const typeConfig = DOC_TYPES[document.type] || DOC_TYPES.other;
    const FileIcon = getFileTypeIcon(document.file_name);
    const isVideo = document.type === 'video' || document.file_name?.match(/\.(mp4|avi|mov|webm)$/i);
    const isYouTube = document.file_url?.includes('youtube.com') || document.file_url?.includes('youtu.be');

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl ${typeConfig.color} relative flex-shrink-0`}>
                    <FileIcon className="w-6 h-6" />
                    {(isVideo || isYouTube) && (
                        <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-0.5">
                            <Play className="w-2.5 h-2.5 text-white" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h4 className="font-medium text-slate-900 truncate">{document.title}</h4>
                            {document.description && (
                                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{document.description}</p>
                            )}
                        </div>

                        <Badge className={typeConfig.color}>
                            {typeConfig.label}
                        </Badge>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>{document.file_name || 'N/A'}</span>
                        <span>•</span>
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(document.created_at)}</span>
                        {document.download_count > 0 && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    {document.download_count}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {(isVideo || isYouTube) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPreview(document)}
                            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                        >
                            <Play className="w-4 h-4" />
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(document)}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        {isYouTube ? (
                            <ExternalLink className="w-4 h-4" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                    </Button>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>

                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border z-20 py-1">
                                    <button
                                        onClick={() => { onPreview(document); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Xem trước
                                    </button>
                                    <button
                                        onClick={() => { onDownload(document); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        Tải xuống
                                    </button>
                                    <hr className="my-1" />
                                    <button
                                        onClick={() => { onDelete(document); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Xóa
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Upload modal component
function UploadModal({ classId, courseId, getHeaders, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'lesson',
        linkUrl: ''
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'link'

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file size (max 50MB)
            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('File không được vượt quá 50MB');
                return;
            }
            setFile(selectedFile);
            setError('');
            // Auto-fill title from filename
            if (!formData.title) {
                const name = selectedFile.name.replace(/\.[^/.]+$/, '');
                setFormData(prev => ({ ...prev, title: name }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            setError('Vui lòng nhập tên tài liệu');
            return;
        }

        if (uploadMode === 'file' && !file) {
            setError('Vui lòng chọn file để tải lên');
            return;
        }

        if (uploadMode === 'link' && !formData.linkUrl.trim()) {
            setError('Vui lòng nhập đường dẫn');
            return;
        }

        setUploading(true);
        try {
            let fileUrl = formData.linkUrl;
            let fileName = '';
            let fileSize = 0;

            // Upload file to Supabase Storage if mode is 'file'
            if (uploadMode === 'file' && file) {
                const fileExt = file.name.split('.').pop();
                const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `class-documents/${classId}/${uniqueName}`;

                const { error: uploadError } = await supabase.storage
                    .from('document')
                    .upload(filePath, file);

                if (uploadError) throw new Error(uploadError.message);

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('document')
                    .getPublicUrl(filePath);

                fileUrl = urlData.publicUrl;
                fileName = file.name;
                fileSize = file.size;
            }

            // Create document record
            const headers = getHeaders();
            const response = await fetch(`${API_URL}/api/admin/documents`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    type: formData.type,
                    file_url: fileUrl,
                    file_name: fileName || formData.linkUrl,
                    file_size: fileSize,
                    class_id: classId,
                    course_id: courseId
                })
            });

            const json = await response.json();
            if (!json.success) throw new Error(json.message || 'Có lỗi xảy ra');

            onSuccess();
        } catch (err) {
            console.error('Error uploading:', err);
            setError(err.message || 'Không thể tải lên tài liệu');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-slate-900">Thêm tài liệu mới</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Upload mode toggle */}
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setUploadMode('file')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${uploadMode === 'file'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <Upload className="w-4 h-4" />
                            Tải file
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode('link')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${uploadMode === 'link'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <LinkIcon className="w-4 h-4" />
                            Đường dẫn
                        </button>
                    </div>

                    {/* File upload */}
                    {uploadMode === 'file' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Chọn file
                            </label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.avi,.mov,.webm,.jpg,.jpeg,.png,.gif"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <Check className="w-8 h-8 text-green-500" />
                                            <div className="text-left">
                                                <p className="font-medium text-slate-900">{file.name}</p>
                                                <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                            <p className="text-sm text-slate-600">
                                                <span className="text-indigo-600 font-medium">Nhấn để chọn</span> hoặc kéo thả file
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                PDF, Word, Excel, PowerPoint, Video, Image (tối đa 50MB)
                                            </p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Link input */}
                    {uploadMode === 'link' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Đường dẫn (URL)
                            </label>
                            <Input
                                type="url"
                                placeholder="https://youtube.com/watch?v=... hoặc URL file"
                                value={formData.linkUrl}
                                onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Hỗ trợ YouTube, Google Drive, Vimeo hoặc link trực tiếp đến file
                            </p>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tên tài liệu <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="VD: Bài giảng Tuần 1 - Giới thiệu"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mô tả
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Mô tả ngắn về nội dung tài liệu..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Loại tài liệu
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(DOC_TYPES).map(([key, config]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: key }))}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.type === key
                                        ? config.color
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <config.icon className="w-4 h-4" />
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={uploading}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang tải lên...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Tải lên
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Preview modal component
function PreviewModal({ document, onClose }) {
    const isVideo = document.type === 'video' ||
        document.file_name?.match(/\.(mp4|avi|mov|webm)$/i);
    const isYouTube = document.file_url?.includes('youtube.com') ||
        document.file_url?.includes('youtu.be');
    const isPdf = document.file_name?.toLowerCase().endsWith('.pdf');
    const isImage = document.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isOfficeDoc = document.file_name?.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);
    const isTextFile = document.file_name?.match(/\.(txt|md|json|xml|csv)$/i);

    // Get YouTube embed URL - supports regular videos, shorts, and youtu.be links
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;

        // Handle YouTube Shorts: youtube.com/shorts/VIDEO_ID
        const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch) {
            return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        }

        // Handle regular YouTube URLs
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }

        return null;
    };

    // Get Office document viewer URL (using Google Docs Viewer or Microsoft Office Online)
    const getOfficeViewerUrl = (url) => {
        if (!url) return null;
        // Google Docs Viewer - works for public URLs
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        // Alternative: Microsoft Office Online
        // return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    };

    const embedUrl = isYouTube ? getYouTubeEmbedUrl(document.file_url) : null;
    const officeViewerUrl = isOfficeDoc ? getOfficeViewerUrl(document.file_url) : null;

    // Debug log
    console.log('Preview Modal:', {
        file_url: document.file_url,
        file_name: document.file_name,
        isYouTube,
        isVideo,
        isPdf,
        isImage,
        isOfficeDoc,
        embedUrl,
        officeViewerUrl
    });

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="font-semibold text-slate-900">{document.title}</h3>
                        <p className="text-sm text-slate-500">{document.file_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(document.file_url, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Mở tab mới
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const a = window.document.createElement('a');
                                a.href = document.file_url;
                                a.download = document.file_name || 'download';
                                a.click();
                            }}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Tải xuống
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center">
                    {embedUrl ? (
                        // YouTube Video
                        <div className="w-full h-full flex items-center justify-center bg-black p-4">
                            <iframe
                                src={embedUrl}
                                className="w-full aspect-video max-h-[70vh] rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : isVideo ? (
                        // Local Video (mp4, webm, etc.)
                        <div className="w-full h-full flex items-center justify-center bg-black p-4">
                            <video
                                src={document.file_url}
                                controls
                                autoPlay={false}
                                className="max-w-full max-h-[70vh] rounded-lg"
                            >
                                Trình duyệt không hỗ trợ video này
                            </video>
                        </div>
                    ) : isPdf ? (
                        // PDF Document
                        <iframe
                            src={document.file_url}
                            className="w-full h-full min-h-[70vh] bg-white"
                            title={document.title}
                        />
                    ) : isOfficeDoc ? (
                        // Office Documents (Word, Excel, PowerPoint)
                        <div className="w-full h-full flex flex-col">
                            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Đang xem qua Google Docs Viewer
                            </div>
                            <iframe
                                src={officeViewerUrl}
                                className="w-full flex-1 min-h-[65vh] bg-white"
                                title={document.title}
                            />
                        </div>
                    ) : isImage ? (
                        // Images
                        <div className="w-full h-full flex items-center justify-center p-4 bg-slate-800">
                            <img
                                src={document.file_url}
                                alt={document.title}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                            />
                        </div>
                    ) : isTextFile ? (
                        // Text files - fetch and display
                        <TextFilePreview url={document.file_url} />
                    ) : (
                        // Unsupported file type
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <File className="w-10 h-10 text-slate-400" />
                            </div>
                            <h4 className="font-medium text-slate-700 mb-2">Không thể xem trước file này</h4>
                            <p className="text-sm text-slate-500 mb-4">
                                Định dạng file: {document.file_name?.split('.').pop()?.toUpperCase() || 'Không xác định'}
                            </p>
                            <Button
                                onClick={() => window.open(document.file_url, '_blank')}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Tải xuống để xem
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Text file preview component
function TextFilePreview({ url }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch');
                const text = await response.text();
                setContent(text);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [url]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p className="text-slate-500">Không thể tải nội dung file</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto bg-slate-900 p-4">
            <pre className="text-sm text-slate-200 font-mono whitespace-pre-wrap">
                {content}
            </pre>
        </div>
    );
}

export default ClassDocumentsTab;
