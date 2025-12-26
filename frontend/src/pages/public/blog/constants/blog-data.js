// ============================================
// BLOG CONSTANTS & MOCK DATA
// ============================================

import { BookOpen, Users, TrendingUp } from 'lucide-react';

// Categories
export const CATEGORIES = [
    { id: 'all', label: 'Tất cả', icon: BookOpen },
    { id: 'ielts', label: 'IELTS', icon: TrendingUp },
    { id: 'toeic', label: 'TOEIC', icon: Users },
    { id: 'it', label: 'Tin học', icon: BookOpen },
];

// Popular Tags
export const POPULAR_TAGS = [
    { name: 'IELTS Writing', count: 12 },
    { name: 'Speaking Tips', count: 8 },
    { name: 'TOEIC Grammar', count: 15 },
    { name: 'Excel', count: 10 },
    { name: 'Vocabulary', count: 18 },
    { name: 'Listening', count: 11 },
    { name: 'PowerPoint', count: 6 },
    { name: 'Reading', count: 9 },
];

// Sort Options
export const SORT_OPTIONS = [
    { id: 'newest', label: 'Mới nhất' },
    { id: 'oldest', label: 'Cũ nhất' },
    { id: 'popular', label: 'Phổ biến' },
    { id: 'readTime', label: 'Thời gian đọc' },
];

// Mock Posts Data
export const MOCK_POSTS = [
    {
        id: 1, slug: 'lo-trinh-tu-hoc-ielts-5-len-7',
        title: 'Lộ trình tự học IELTS từ 5.0 lên 7.0 trong 6 tháng',
        excerpt: 'Bộ hướng dẫn chi tiết giúp bạn cải thiện band IELTS một cách hiệu quả với phương pháp học tập khoa học và lịch trình cụ thể từng tuần.',
        category: 'ielts', date: '2024-12-21', readTime: 12, views: 2340,
        thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
        featured: true, tags: ['IELTS', 'Lộ trình', 'Tự học']
    },
    {
        id: 2, slug: 'cach-lam-bai-thi-toeic-listening',
        title: 'Chiến thuật làm bài TOEIC Listening đạt 400+ điểm',
        excerpt: 'Những kỹ thuật và mẹo hay giúp bạn tối ưu điểm số Listening trong kỳ thi TOEIC với các phương pháp đã được kiểm chứng.',
        category: 'toeic', date: '2024-12-19', readTime: 8, views: 1850,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
        featured: true, tags: ['TOEIC', 'Listening', 'Tips']
    },
    {
        id: 3, slug: 'excel-cong-thuc-can-biet',
        title: '50 công thức Excel cần biết cho dân văn phòng',
        excerpt: 'Tổng hợp các công thức Excel từ cơ bản đến nâng cao, giúp bạn làm việc hiệu quả hơn và tiết kiệm thời gian đáng kể.',
        category: 'it', date: '2024-12-18', readTime: 15, views: 3200,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
        featured: true, tags: ['Excel', 'Công thức', 'Văn phòng']
    },
    {
        id: 4, slug: 'ielts-writing-task-2-template',
        title: 'Template viết IELTS Writing Task 2 Band 7+',
        excerpt: 'Cấu trúc bài viết chi tiết kèm các cụm từ academic giúp bạn đạt band điểm cao trong phần thi Writing Task 2.',
        category: 'ielts', date: '2024-12-15', readTime: 10, views: 1920,
        thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
        tags: ['IELTS Writing', 'Template', 'Band 7']
    },
    {
        id: 5, slug: 'toeic-part-5-grammar',
        title: 'Tổng hợp ngữ pháp TOEIC Part 5 thường gặp',
        excerpt: 'Các điểm ngữ pháp quan trọng xuất hiện với tần suất cao trong Part 5 và cách nhận biết đáp án đúng nhanh chóng.',
        category: 'toeic', date: '2024-12-12', readTime: 7, views: 1650,
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
        tags: ['TOEIC', 'Grammar', 'Part 5']
    },
    {
        id: 6, slug: 'powerpoint-thiet-ke-chuyen-nghiep',
        title: 'Bí quyết thiết kế PowerPoint chuyên nghiệp',
        excerpt: 'Hướng dẫn tạo slide thuyết trình đẹp mắt, thu hút với các nguyên tắc thiết kế cơ bản và template miễn phí.',
        category: 'it', date: '2024-12-10', readTime: 9, views: 980,
        thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
        tags: ['PowerPoint', 'Thiết kế', 'Thuyết trình']
    },
    {
        id: 7, slug: 'ielts-speaking-part-1',
        title: 'Các câu hỏi IELTS Speaking Part 1 thường gặp & mẫu trả lời',
        excerpt: 'Tổng hợp 50+ câu hỏi Speaking Part 1 kèm ideas và cách triển khai câu trả lời tự nhiên, ghi điểm.',
        category: 'ielts', date: '2024-12-08', readTime: 11, views: 2100,
        thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
        tags: ['IELTS Speaking', 'Part 1', 'Mẫu câu']
    },
    {
        id: 8, slug: 'toeic-reading-strategies',
        title: '7 chiến lược đọc hiểu TOEIC Reading Part 7 hiệu quả',
        excerpt: 'Phương pháp làm bài Reading nhanh và chính xác, tối ưu thời gian cho các dạng bài Single và Multiple Passages.',
        category: 'toeic', date: '2024-12-05', readTime: 13, views: 1420,
        thumbnail: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
        tags: ['TOEIC Reading', 'Part 7', 'Strategies']
    },
    {
        id: 9, slug: 'word-mail-merge',
        title: 'Hướng dẫn Mail Merge trong Word: Tạo thư hàng loạt',
        excerpt: 'Từng bước tạo thư mời, chứng nhận, phong bì hàng loạt với tính năng Mail Merge của Microsoft Word.',
        category: 'it', date: '2024-12-03', readTime: 8, views: 760,
        thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
        tags: ['Word', 'Mail Merge', 'Tự động hóa']
    },
    {
        id: 10, slug: 'ielts-vocabulary-academic',
        title: '500 từ vựng IELTS Academic thường gặp nhất',
        excerpt: 'Danh sách từ vựng Academic Word List với ví dụ và cách sử dụng trong Writing và Speaking.',
        category: 'ielts', date: '2024-12-01', readTime: 20, views: 2890,
        thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
        tags: ['IELTS', 'Vocabulary', 'Academic']
    },
    {
        id: 11, slug: 'toeic-part-2-tips',
        title: 'Mẹo nghe TOEIC Part 2: Nhận diện bẫy thường gặp',
        excerpt: 'Các loại bẫy trong Part 2 và cách loại trừ đáp án sai một cách nhanh chóng.',
        category: 'toeic', date: '2024-11-28', readTime: 6, views: 1280,
        thumbnail: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
        tags: ['TOEIC', 'Part 2', 'Listening']
    },
    {
        id: 12, slug: 'google-sheets-formulas',
        title: 'Google Sheets: Công thức và hàm cần biết',
        excerpt: 'So sánh Google Sheets với Excel và các hàm độc quyền của Sheets mà bạn nên biết.',
        category: 'it', date: '2024-11-25', readTime: 12, views: 890,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
        tags: ['Google Sheets', 'Formulas', 'Cloud']
    },
];

// Helper Functions
export const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatViews = (views) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
    return views.toString();
};

// Get related posts by category and tags
export const getRelatedPosts = (currentPost, allPosts, limit = 3) => {
    return allPosts
        .filter(post => post.id !== currentPost.id)
        .map(post => {
            let score = 0;
            // Same category = 3 points
            if (post.category === currentPost.category) score += 3;
            // Matching tags = 1 point each
            const matchingTags = post.tags?.filter(tag =>
                currentPost.tags?.includes(tag)
            ).length || 0;
            score += matchingTags;
            return { ...post, relevanceScore: score };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
};
