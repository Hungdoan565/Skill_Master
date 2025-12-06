/**
 * Documents Utils
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const DOCUMENT_TYPES = [
    { value: 'lesson', label: 'Bài giảng', icon: 'BookOpen', color: 'bg-blue-100 text-blue-700' },
    { value: 'exercise', label: 'Bài tập', icon: 'FileText', color: 'bg-green-100 text-green-700' },
    { value: 'exam', label: 'Đề thi', icon: 'ClipboardList', color: 'bg-red-100 text-red-700' },
    { value: 'material', label: 'Tài liệu tham khảo', icon: 'File', color: 'bg-purple-100 text-purple-700' },
    { value: 'video', label: 'Video', icon: 'Video', color: 'bg-pink-100 text-pink-700' },
    { value: 'other', label: 'Khác', icon: 'Folder', color: 'bg-slate-100 text-slate-700' },
];

export const FILE_ICONS = {
    pdf: { icon: 'FileText', color: 'text-red-500' },
    doc: { icon: 'FileText', color: 'text-blue-500' },
    docx: { icon: 'FileText', color: 'text-blue-500' },
    xls: { icon: 'Sheet', color: 'text-green-500' },
    xlsx: { icon: 'Sheet', color: 'text-green-500' },
    ppt: { icon: 'Presentation', color: 'text-orange-500' },
    pptx: { icon: 'Presentation', color: 'text-orange-500' },
    jpg: { icon: 'Image', color: 'text-purple-500' },
    jpeg: { icon: 'Image', color: 'text-purple-500' },
    png: { icon: 'Image', color: 'text-purple-500' },
    mp4: { icon: 'Video', color: 'text-pink-500' },
    webm: { icon: 'Video', color: 'text-pink-500' },
    mov: { icon: 'Video', color: 'text-pink-500' },
    mp3: { icon: 'Music', color: 'text-indigo-500' },
    zip: { icon: 'Archive', color: 'text-yellow-500' },
    rar: { icon: 'Archive', color: 'text-yellow-500' },
};

export const getFileIcon = (filename) => {
    if (!filename) return FILE_ICONS.pdf;
    const ext = filename.split('.').pop()?.toLowerCase();
    return FILE_ICONS[ext] || { icon: 'File', color: 'text-slate-500' };
};

export const getDocTypeConfig = (type) => {
    return DOCUMENT_TYPES.find(t => t.value === type) || DOCUMENT_TYPES[5];
};

export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

/**
 * Check if URL is a video file
 */
export const isVideoFile = (filename) => {
    if (!filename) return false;
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'];
    const ext = filename.split('.').pop()?.toLowerCase();
    return videoExtensions.includes(ext);
};

/**
 * Check if URL is from YouTube
 */
export const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * Check if URL is from Vimeo
 */
export const isVimeoUrl = (url) => {
    if (!url) return false;
    return url.includes('vimeo.com');
};

/**
 * Extract YouTube video ID from URL
 */
export const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

/**
 * Extract Vimeo video ID from URL
 */
export const getVimeoVideoId = (url) => {
    if (!url) return null;
    const regex = /vimeo\.com\/(?:.*\/)?(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

/**
 * Get video embed URL
 */
export const getVideoEmbedUrl = (url) => {
    if (isYouTubeUrl(url)) {
        const videoId = getYouTubeVideoId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (isVimeoUrl(url)) {
        const videoId = getVimeoVideoId(url);
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
};

/**
 * Check if document is a video (file or embed)
 */
export const isVideoDocument = (document) => {
    return document.type === 'video' ||
        isVideoFile(document.file_name) ||
        isYouTubeUrl(document.file_url) ||
        isVimeoUrl(document.file_url);
};
