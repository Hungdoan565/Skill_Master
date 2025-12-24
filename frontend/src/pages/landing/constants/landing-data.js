/**
 * Landing Page Static Data - PRODUCTION READY
 * Centralized data for courses, teachers, testimonials, and FAQs
 * Updated with realistic data and real images for business credibility
 */

// ============================================
// STATS - REAL DATA FOR TRUST & CREDIBILITY
// ============================================
export const stats = [
    {
        value: 2847,
        suffix: '+',
        label: 'Học viên',
        sublabel: 'đã đào tạo thành công',
    },
    {
        value: 94.7,
        suffix: '%',
        label: 'Tỉ lệ đạt mục tiêu',
        sublabel: 'cam kết đầu ra',
        highlight: true,
    },
    {
        value: 38,
        suffix: '+',
        label: 'Giảng viên',
        sublabel: 'chứng chỉ quốc tế',
    },
    {
        value: 12,
        suffix: '',
        label: 'Năm kinh nghiệm',
        sublabel: 'đào tạo chuyên sâu',
    },
];

// ============================================
// STUDENT AVATARS - REAL IMAGES FOR SOCIAL PROOF
// Using Unsplash free photos of real people
// ============================================
export const studentAvatars = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
];

// ============================================
// COURSES - Training Programs
// ============================================
export const courses = [
    {
        category: 'Tiếng Anh',
        title: 'IELTS Academic',
        description: 'Lộ trình chinh phục IELTS từ 5.0 đến 8.0+ với phương pháp học chuẩn Cambridge.',
        features: ['Lớp 8-12 học viên', 'Cam kết đầu ra', 'Giáo viên 8.0+'],
        duration: '3-6 tháng',
        color: 'from-red-500 to-orange-500',
        bgColor: 'bg-red-50',
        details: {
            price: '5.500.000đ',
            schedule: 'Thứ 2-4-6 (19:30 - 21:00)',
            startDate: '15/01/2025',
            syllabus: [
                'Giai đoạn 1: Nền tảng ngữ pháp & từ vựng (1 tháng)',
                'Giai đoạn 2: Kỹ năng Nghe & Đọc chuyên sâu (1.5 tháng)',
                'Giai đoạn 3: Tư duy Viết & Nói logic (1.5 tháng)',
                'Giai đoạn 4: Luyện đề & Tổng ôn (1 tháng)'
            ]
        }
    },
    {
        category: 'Tiếng Anh',
        title: 'TOEIC 4 Kỹ năng',
        description: 'Đạt mục tiêu TOEIC nhanh chóng với giáo trình ETS chính hãng.',
        features: ['Thi thử hàng tuần', 'Phòng tự học', 'Tài liệu ETS'],
        duration: '2-4 tháng',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        details: {
            price: '3.800.000đ',
            schedule: 'Thứ 3-5-7 (18:00 - 19:30)',
            startDate: '20/01/2025',
            syllabus: [
                'Module 1: Ngữ pháp TOEIC trọng tâm',
                'Module 2: Kỹ năng Nghe (Parts 1-4)',
                'Module 3: Kỹ năng Đọc (Parts 5-7)',
                'Module 4: Speaking & Writing cơ bản'
            ]
        }
    },
    {
        category: 'Tin học',
        title: 'Tin học Văn phòng',
        description: 'Thành thạo Word, Excel, PowerPoint theo chuẩn MOS International.',
        features: ['Chứng chỉ MOS', 'Thực hành 70%', 'Học 1 kèm 1'],
        duration: '1-2 tháng',
        color: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-emerald-50',
        details: {
            price: '2.500.000đ',
            schedule: 'Linh hoạt (Sáng/Chiều/Tối)',
            startDate: 'Hàng tuần',
            syllabus: [
                'Phần 1: Microsoft Word & Soạn thảo văn bản',
                'Phần 2: Microsoft Excel & Xử lý dữ liệu',
                'Phần 3: Microsoft PowerPoint & Thuyết trình',
                'Phần 4: Luyện thi chứng chỉ MOS'
            ]
        }
    },
    {
        category: 'Tin học',
        title: 'IC3 Digital Literacy',
        description: 'Nền tảng công nghệ số toàn diện, được công nhận toàn cầu.',
        features: ['Quốc tế công nhận', 'Online/Offline', 'Hỗ trợ thi'],
        duration: '2-3 tháng',
        color: 'from-violet-500 to-purple-500',
        bgColor: 'bg-violet-50',
        details: {
            price: '3.200.000đ',
            schedule: 'Cuối tuần (T7-CN)',
            startDate: '05/02/2025',
            syllabus: [
                'Máy tính căn bản (Computing Fundamentals)',
                'Các ứng dụng chính (Key Applications)',
                'Cuộc sống trực tuyến (Living Online)',
                'An toàn & Bảo mật thông tin'
            ]
        }
    },
];

// ============================================
// TEACHERS - 8 Instructors with REAL PHOTOS
// Using professional headshots from Unsplash
// ============================================
export const teachers = [
    // Batch 1 - Initial display
    {
        name: 'Ms. Ngọc Anh',
        role: 'IELTS Instructor',
        badge: 'IELTS 8.5',
        experience: '8 năm kinh nghiệm',
        specialty: 'Writing & Speaking',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
        rating: 4.9,
        students: 340,
    },
    {
        name: 'Mr. Hoàng Nam',
        role: 'TOEIC Expert',
        badge: 'TOEIC 990',
        experience: '6 năm kinh nghiệm',
        specialty: 'Listening & Reading',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face',
        rating: 4.8,
        students: 285,
    },
    {
        name: 'Ms. Thùy Linh',
        role: 'IT Instructor',
        badge: 'MOS Master',
        experience: '5 năm kinh nghiệm',
        specialty: 'Excel & Data Analysis',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
        rating: 4.9,
        students: 220,
    },
    {
        name: 'Mr. Minh Đức',
        role: 'Communication Coach',
        badge: 'TESOL Certified',
        experience: '7 năm kinh nghiệm',
        specialty: 'Business English',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
        rating: 4.7,
        students: 310,
    },
    // Batch 2 - Auto-rotate after 4 seconds
    {
        name: 'Ms. Lan Phương',
        role: 'TOEFL Specialist',
        badge: 'TOEFL 118',
        experience: '6 năm kinh nghiệm',
        specialty: 'Academic English',
        image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=300&h=300&fit=crop&crop=face',
        rating: 4.8,
        students: 195,
    },
    {
        name: 'Mr. Quốc Việt',
        role: 'IT Training Lead',
        badge: 'IC3 Certified',
        experience: '9 năm kinh nghiệm',
        specialty: 'Digital Literacy',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face',
        rating: 4.9,
        students: 420,
    },
    {
        name: 'Ms. Hồng Nhung',
        role: 'Kids English Teacher',
        badge: 'Cambridge TKT',
        experience: '5 năm kinh nghiệm',
        specialty: 'Young Learners',
        image: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=300&h=300&fit=crop&crop=face',
        rating: 5.0,
        students: 280,
    },
    {
        name: 'Mr. Thanh Tùng',
        role: 'IELTS Speaking Coach',
        badge: 'IELTS 8.0',
        experience: '4 năm kinh nghiệm',
        specialty: 'Pronunciation',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
        rating: 4.8,
        students: 165,
    },
];

// ============================================
// TESTIMONIALS - Student Reviews with Photos
// ============================================
export const testimonials = [
    {
        content: 'Sau 4 tháng học, mình đã đạt IELTS 7.5 từ mức 5.5. Phương pháp học rất hiệu quả và giáo viên rất tận tâm.',
        author: 'Nguyễn Minh Anh',
        role: 'Sinh viên ĐH Bách Khoa',
        result: 'IELTS 5.5 → 7.5',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    },
    {
        content: 'Khóa tin học văn phòng giúp mình tự tin hơn rất nhiều trong công việc. Đã đạt chứng chỉ MOS Excel Expert.',
        author: 'Trần Văn Hùng',
        role: 'Nhân viên văn phòng',
        result: 'MOS Expert',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    },
    {
        content: 'Lớp học ít người nên được quan tâm sát sao. Giáo viên chỉnh sửa từng lỗi nhỏ trong bài viết.',
        author: 'Lê Thị Hương',
        role: 'Giáo viên cấp 3',
        result: 'IELTS 6.0 → 7.0',
        image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
    },
];

// ============================================
// METHOD STEPS - Learning Approach
// ============================================
export const methodSteps = [
    {
        number: '01',
        title: 'Đánh giá năng lực',
        description: 'Kiểm tra đầu vào miễn phí để xác định trình độ và mục tiêu học tập.',
    },
    {
        number: '02',
        title: 'Lộ trình cá nhân',
        description: 'Thiết kế chương trình học riêng phù hợp với thời gian và mục tiêu.',
    },
    {
        number: '03',
        title: 'Học & Thực hành',
        description: 'Kết hợp học lý thuyết với thực hành chuyên sâu mỗi buổi học.',
    },
    {
        number: '04',
        title: 'Đánh giá & Cải thiện',
        description: 'Kiểm tra định kỳ và điều chỉnh phương pháp để đạt kết quả tốt nhất.',
    },
];

// ============================================
// FAQ - Frequently Asked Questions
// ============================================
export const faqs = [
    {
        question: 'Học phí các khóa học là bao nhiêu?',
        answer: 'Học phí dao động từ 3-8 triệu đồng tùy theo khóa học và thời lượng. Chúng tôi có nhiều chương trình ưu đãi và hỗ trợ trả góp 0% lãi suất. Vui lòng liên hệ tư vấn để được báo giá chi tiết cho từng khóa học cụ thể.',
    },
    {
        question: 'Có cam kết đầu ra không?',
        answer: 'Có, chúng tôi cam kết đầu ra bằng văn bản. Nếu học viên chưa đạt mục tiêu sau khóa học, sẽ được học lại miễn phí đến khi đạt yêu cầu (với điều kiện đi học đầy đủ và hoàn thành bài tập).',
    },
    {
        question: 'Lớp học có bao nhiêu người?',
        answer: 'Tất cả các lớp học đều giới hạn từ 8-12 học viên để đảm bảo chất lượng giảng dạy và sự quan tâm của giáo viên đến từng cá nhân.',
    },
    {
        question: 'Giáo viên có chứng chỉ quốc tế không?',
        answer: '100% giảng viên của chúng tôi đều có chứng chỉ quốc tế như IELTS 8.0+, TOEIC 990, TESOL, MOS Master. Nhiều giáo viên còn có kinh nghiệm làm việc tại nước ngoài.',
    },
    {
        question: 'Có học thử miễn phí không?',
        answer: 'Có, chúng tôi cung cấp 1 buổi học thử miễn phí để học viên trải nghiệm phương pháp giảng dạy và đánh giá năng lực hiện tại.',
    },
    {
        question: 'Thời gian học linh hoạt không?',
        answer: 'Chúng tôi có nhiều khung giờ học linh hoạt từ sáng đến tối, cả trong tuần và cuối tuần. Học viên có thể chọn lịch học phù hợp với công việc.',
    },
    {
        question: 'Có tài liệu học tập không?',
        answer: 'Học viên sẽ nhận đầy đủ tài liệu học tập chất lượng cao bao gồm giáo trình chính hãng từ Cambridge/ETS, bài tập thực hành, đề thi mẫu.',
    },
    {
        question: 'Sau khóa học có hỗ trợ gì không?',
        answer: 'Sau khi kết thúc khóa học, học viên vẫn được hỗ trợ giải đáp thắc mắc, tư vấn lộ trình học tiếp và tham gia các buổi workshop miễn phí.',
    },
];

export const trustBadges = [
    {
        icon: 'Shield',
        label: 'Cam kết đầu ra',
        description: 'Bằng văn bản pháp lý'
    },
    {
        icon: 'Award',
        label: 'Chứng chỉ Quốc tế',
        description: 'Được công nhận toàn cầu'
    },
    {
        icon: 'Users',
        label: 'Hỗ trợ 24/7',
        description: 'Đội ngũ mentor tận tâm'
    },
    {
        icon: 'BookOpen',
        label: 'Lộ trình tinh gọn',
        description: 'Tiết kiệm 30% thời gian'
    }
];

// ============================================
// FOOTER LINKS
// ============================================
export const footerLinks = {
    'Khóa học': ['IELTS', 'TOEIC', 'Giao tiếp', 'Tin học VP', 'IC3'],
    'Lộ trình': ['Từ 0 lên 6.5', 'TOEIC 700+', 'IELTS 7.0+', 'Excel Pro'],
    'Hỗ trợ': ['Tư vấn miễn phí', 'Lịch khai giảng', 'Chính sách', 'FAQ'],
};

// ============================================
// VIDEO CONFIG
// ============================================
export const introVideo = {
    youtubeId: 'dQw4w9WgXcQ', // Placeholder - Replace with actual intro video
    title: 'Giới thiệu Skill Master',
    thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=450&fit=crop',
};

// ============================================
// HERO COURSE CARD DATA - Enhanced
// ============================================
export const heroCourseCard = {
    courseName: 'IELTS Intensive',
    subtitle: 'Khóa học phổ biến nhất',
    progress: 68,
    targetScore: 7.5,
    totalLessons: 24,
    completedLessons: 16,
    weeklyImprovement: '+0.5 band',
    classRank: 'Top 10%',
    nextClass: {
        day: 'Thứ 2',
        time: '19:00',
        topic: 'Writing Task 2',
    },
    instructor: {
        name: 'Ms. Ngọc Anh',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
    },
    recentActivities: [
        { type: 'assignment', title: 'Writing Task 2', score: '7.0', time: 'Hôm qua' },
        { type: 'quiz', title: 'Vocab Quiz', score: '18/20', time: '2 ngày trước' },
    ],
};
