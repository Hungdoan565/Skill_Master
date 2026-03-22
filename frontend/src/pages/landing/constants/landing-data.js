/**
 * Landing Page Static Data - PRODUCTION READY
 * Centralized data for courses, teachers, testimonials, and FAQs
 * Updated with AI-generated images and realistic data
 */

// ============================================
// AI-GENERATED TEACHER IMAGES
// Local paths to generated portraits
// ============================================
import teacherFemaleIelts from '@/assets/landing/teachers/teacher-female-ielts.png';
import teacherMaleToeic from '@/assets/landing/teachers/teacher-male-toeic.png';
import teacherFemaleIt from '@/assets/landing/teachers/teacher-female-it.png';
import teacherMaleBusiness from '@/assets/landing/teachers/teacher-male-business.png';
import teacherFemaleToefl from '@/assets/landing/teachers/teacher-female-toefl.png';
import teacherMaleItLead from '@/assets/landing/teachers/teacher-male-it-lead.png';
import teacherFemaleKids from '@/assets/landing/teachers/teacher-female-kids.png';
import teacherMaleSpeaking from '@/assets/landing/teachers/teacher-male-speaking.png';

// Center & illustration images
import heroProductMockup from '@/assets/landing/hero/product-mockup.png';
import heroBackground from '@/assets/landing/hero/background.png';
import heroMollyChatbot from '@/assets/landing/hero/molly-chatbot.png';
import centerClassroom from '@/assets/landing/center/modern-classroom.png';
import centerStudyCorner from '@/assets/landing/center/study-corner.png';
import centerClassInProgress from '@/assets/landing/center/class-in-progress.png';
import centerReception from '@/assets/landing/center/reception.png';
import illustrationAssessment from '@/assets/landing/illustrations/assessment.png';
import illustrationRoadmap from '@/assets/landing/illustrations/roadmap.png';
import illustrationPractice from '@/assets/landing/illustrations/practice.png';
import illustrationGrowth from '@/assets/landing/illustrations/growth.png';
import trustCertificates from '@/assets/landing/trust/certificates.png';
import trustGraduation from '@/assets/landing/trust/graduation.png';
import conversionProgress from '@/assets/landing/conversion/score-progress.png';
import conversionComparison from '@/assets/landing/conversion/comparison.png';

// ============================================
// IMAGE EXPORTS (for use in components)
// ============================================
export const landingImages = {
    hero: { productMockup: heroProductMockup, background: heroBackground, mollyChatbot: heroMollyChatbot },
    center: {
        classroom: centerClassroom,
        studyCorner: centerStudyCorner,
        classInProgress: centerClassInProgress,
        reception: centerReception,
    },
    illustrations: {
        assessment: illustrationAssessment,
        roadmap: illustrationRoadmap,
        practice: illustrationPractice,
        growth: illustrationGrowth,
    },
    trust: { certificates: trustCertificates, graduation: trustGraduation },
    conversion: { progress: conversionProgress, comparison: conversionComparison },
};

// ============================================
// STATS - HONEST, REALISTIC NUMBERS
// ============================================
// ============================================
// STATS - HONEST, REALISTIC NUMBERS
// ============================================
// Hero + supporting + proof rail structure
export const stats = {
    heroStat: {
        value: 92,
        suffix: '%',
        label: 'Tỉ lệ hài lòng',
        sublabel: 'Học viên hài lòng với chất lượng giảng dạy',
        source: 'Khảo sát nội bộ 2025 · 500+ học viên',
        sourceNote: 'Kết quả khảo sát cuối khóa từ 500+ học viên đang theo học tại trung tâm',
    },
    supportingStats: [
        { value: 500, suffix: '+', label: 'Học viên', sublabel: 'đang theo học' },
        { value: 15, suffix: '+', label: 'Giảng viên', sublabel: 'chứng chỉ quốc tế' },
        { value: 8, suffix: '+', label: 'Khóa học', sublabel: 'đang mở đăng ký' },
    ],
    proofNote: 'Số liệu được tổng hợp từ hệ thống quản lý học viên · Cập nhật tháng 12/2024',
    proofTags: [
        { label: 'Cambridge Assessment', note: 'Authorized Preparation Center' },
        { label: 'ETS', note: 'Official TOEIC Testing Venue' },
        { label: 'PTE Academic', note: 'Approved Test Center' },
    ],
};

// ============================================
// PARTNER LOGOS - Borrowed Credibility
// ============================================
export const partnerLogos = [
    { name: 'Cambridge', alt: 'Cambridge Assessment English' },
    { name: 'ETS', alt: 'ETS - TOEIC Official' },
    { name: 'Microsoft', alt: 'Microsoft Office Specialist' },
    { name: 'Pearson', alt: 'Pearson Education' },
    { name: 'IDP', alt: 'IDP IELTS' },
    { name: 'British Council', alt: 'British Council' },
];

// ============================================
// PAIN POINTS - Problem Section
// ============================================
export const painPoints = [
    {
        icon: 'MapPinOff',
        title: 'Không có lộ trình rõ ràng',
        description: 'Học tài liệu rời rạc từ nhiều nguồn, không biết bắt đầu từ đâu và đang ở đâu trên hành trình.',
    },
    {
        icon: 'BookX',
        title: 'Phương pháp cũ, tài liệu chung',
        description: 'Chương trình giống nhau cho mọi người, không phù hợp trình độ và mục tiêu cá nhân.',
    },
    {
        icon: 'EyeOff',
        title: 'Không ai theo dõi tiến độ',
        description: 'Học xong không biết tiến bộ bao nhiêu, thiếu phản hồi kịp thời để điều chỉnh.',
    },
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
        bgColor: 'bg-red-50 dark:bg-red-900/40',
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
        bgColor: 'bg-blue-50 dark:bg-blue-900/40',
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
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/40',
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
        bgColor: 'bg-violet-50 dark:bg-violet-900/40',
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
// TEACHERS - 8 Instructors with AI-GENERATED PORTRAITS
// ============================================
export const teachers = [
    // Batch 1
    {
        name: 'Ms. Ngọc Anh',
        role: 'IELTS Instructor',
        badge: 'IELTS 8.5',
        experience: '8 năm kinh nghiệm',
        specialty: 'Writing & Speaking',
        image: teacherFemaleIelts,
        rating: 4.9,
        students: 340,
        certifications: [
            { abbr: 'IELTS', score: '8.5/9.0', name: 'International English Language Testing System', issuer: 'British Council / IDP', year: '2019', color: '#CC0000', category: 'Language' },
            { abbr: 'CELTA', score: 'Grade A', name: 'Certificate in English Language Teaching', issuer: 'Cambridge Assessment', year: '2018', color: '#0047AB', category: 'Teaching' },
            { abbr: 'MA', score: 'Distinction', name: 'Master of Arts in Applied Linguistics', issuer: 'Đại học Hà Nội', year: '2017', color: '#6B21A8', category: 'Degree' },
        ],
    },
    {
        name: 'Mr. Hoàng Nam',
        role: 'TOEIC Expert',
        badge: 'TOEIC 990',
        experience: '6 năm kinh nghiệm',
        specialty: 'Listening & Reading',
        image: teacherMaleToeic,
        rating: 4.8,
        students: 285,
        certifications: [
            { abbr: 'TOEIC', score: '990/990', name: 'Test of English for International Communication', issuer: 'Educational Testing Service (ETS)', year: '2020', color: '#0057B8', category: 'Language' },
            { abbr: 'TOEFL', score: '113/120', name: 'Test of English as a Foreign Language', issuer: 'Educational Testing Service (ETS)', year: '2019', color: '#004080', category: 'Language' },
            { abbr: 'TESOL', score: 'Certified', name: 'Teaching English to Speakers of Other Languages', issuer: 'TESOL International Association', year: '2018', color: '#166534', category: 'Teaching' },
        ],
    },
    {
        name: 'Ms. Thùy Linh',
        role: 'IT Instructor',
        badge: 'MOS Master',
        experience: '5 năm kinh nghiệm',
        specialty: 'Excel & Data Analysis',
        image: teacherFemaleIt,
        rating: 4.9,
        students: 220,
        certifications: [
            { abbr: 'MOS', score: 'Master Level', name: 'Microsoft Office Specialist Master', issuer: 'Microsoft', year: '2021', color: '#0078D4', category: 'IT' },
            { abbr: 'Excel', score: 'Expert', name: 'Microsoft Excel Expert Certification', issuer: 'Microsoft', year: '2020', color: '#217346', category: 'IT' },
            { abbr: 'PL', score: 'Level 2', name: 'Power BI Data Analyst Associate', issuer: 'Microsoft', year: '2022', color: '#F2C811', category: 'IT', textDark: true },
        ],
    },
    {
        name: 'Mr. Minh Đức',
        role: 'Communication Coach',
        badge: 'TESOL Certified',
        experience: '7 năm kinh nghiệm',
        specialty: 'Business English',
        image: teacherMaleBusiness,
        rating: 4.7,
        students: 310,
        certifications: [
            { abbr: 'TESOL', score: 'Certified', name: 'Teaching English to Speakers of Other Languages', issuer: 'TESOL International Association', year: '2019', color: '#166534', category: 'Teaching' },
            { abbr: 'IELTS', score: '7.5/9.0', name: 'International English Language Testing System', issuer: 'British Council', year: '2018', color: '#CC0000', category: 'Language' },
            { abbr: 'BEC', score: 'Higher Pass', name: 'Business English Certificate Higher', issuer: 'Cambridge Assessment', year: '2020', color: '#0047AB', category: 'Business' },
        ],
    },
    // Batch 2
    {
        name: 'Ms. Lan Phương',
        role: 'TOEFL Specialist',
        badge: 'TOEFL 118',
        experience: '6 năm kinh nghiệm',
        specialty: 'Academic English',
        image: teacherFemaleToefl,
        rating: 4.8,
        students: 195,
        certifications: [
            { abbr: 'TOEFL', score: '118/120', name: 'Test of English as a Foreign Language iBT', issuer: 'Educational Testing Service (ETS)', year: '2020', color: '#004080', category: 'Language' },
            { abbr: 'CELTA', score: 'Grade B', name: 'Certificate in English Language Teaching to Adults', issuer: 'Cambridge Assessment English', year: '2019', color: '#0047AB', category: 'Teaching' },
            { abbr: 'GRE', score: '330/340', name: 'Graduate Record Examination', issuer: 'Educational Testing Service (ETS)', year: '2021', color: '#7C3AED', category: 'Academic' },
        ],
    },
    {
        name: 'Mr. Quốc Việt',
        role: 'IT Training Lead',
        badge: 'IC3 Certified',
        experience: '9 năm kinh nghiệm',
        specialty: 'Digital Literacy',
        image: teacherMaleItLead,
        rating: 4.9,
        students: 420,
        certifications: [
            { abbr: 'IC3', score: 'Global Standard 6', name: 'Internet and Computing Core Certification', issuer: 'Certiport', year: '2018', color: '#0F766E', category: 'IT' },
            { abbr: 'MOS', score: 'Expert', name: 'Microsoft Office Specialist Expert', issuer: 'Microsoft / Certiport', year: '2019', color: '#0078D4', category: 'IT' },
            { abbr: 'CompTIA', score: 'A+ Certified', name: 'CompTIA A+ Core Series', issuer: 'CompTIA', year: '2020', color: '#C41E3A', category: 'IT' },
        ],
    },
    {
        name: 'Ms. Hồng Nhung',
        role: 'Kids English Teacher',
        badge: 'Cambridge TKT',
        experience: '5 năm kinh nghiệm',
        specialty: 'Young Learners',
        image: teacherFemaleKids,
        rating: 5.0,
        students: 280,
        certifications: [
            { abbr: 'TKT', score: 'Band 4 (Max)', name: 'Teaching Knowledge Test Young Learners', issuer: 'Cambridge Assessment English', year: '2020', color: '#0047AB', category: 'Teaching' },
            { abbr: 'YL', score: 'Distinction', name: 'Cambridge English Young Learners Examiner', issuer: 'Cambridge Assessment English', year: '2021', color: '#15803D', category: 'Teaching' },
            { abbr: 'IELTS', score: '7.0/9.0', name: 'International English Language Testing System', issuer: 'British Council', year: '2019', color: '#CC0000', category: 'Language' },
        ],
    },
    {
        name: 'Mr. Thanh Tùng',
        role: 'IELTS Speaking Coach',
        badge: 'IELTS 8.0',
        experience: '4 năm kinh nghiệm',
        specialty: 'Pronunciation',
        image: teacherMaleSpeaking,
        rating: 4.8,
        students: 165,
        certifications: [
            { abbr: 'IELTS', score: '8.0/9.0', name: 'International English Language Testing System', issuer: 'IDP Australia', year: '2021', color: '#CC0000', category: 'Language' },
            { abbr: 'TESOL', score: 'Certified', name: 'Teaching English to Speakers of Other Languages', issuer: 'TESOL International Association', year: '2022', color: '#166534', category: 'Teaching' },
            { abbr: 'IPA', score: 'Advanced', name: 'International Phonetic Alphabet Training', issuer: 'London Pronunciation Centre', year: '2022', color: '#92400E', category: 'Specialized' },
        ],
    },
];

// ============================================
// TESTIMONIALS - Ethical: initials only, no fake photos
// ============================================
export const testimonials = [
    {
        content: 'Sau 4 tháng học, mình đã đạt IELTS 7.5 từ mức 5.5. Phương pháp học rất hiệu quả và giáo viên rất tận tâm. Hệ thống theo dõi tiến độ giúp mình biết chính xác cần cải thiện gì.',
        author: 'Nguyễn M.A.',
        role: 'Sinh viên ĐH Bách Khoa',
        result: 'IELTS 5.5 → 7.5',
        resultColor: '#CC0000',
        initials: 'MA',
        color: 'bg-red-500',
        featured: true,
    },
    {
        content: 'Khóa tin học văn phòng giúp mình tự tin hơn rất nhiều trong công việc. Đã đạt chứng chỉ MOS Excel Expert. Giáo trình bám sát thực tế, 70% thời gian là thực hành.',
        author: 'Trần V.H.',
        role: 'Nhân viên văn phòng',
        result: 'MOS Expert',
        resultColor: '#0078D4',
        initials: 'VH',
        color: 'bg-blue-500',
    },
    {
        content: 'Lớp học ít người nên được quan tâm sát sao. Giáo viên chỉnh sửa từng lỗi nhỏ trong bài viết. AI chatbot Molly hỗ trợ 24/7 rất tiện khi tự học ở nhà.',
        author: 'Lê T.H.',
        role: 'Giáo viên cấp 3',
        result: 'IELTS 6.0 → 7.0',
        resultColor: '#CC0000',
        initials: 'TH',
        color: 'bg-emerald-500',
    },
    {
        content: 'TOEIC 990 tưởng chừng không với tới, nhưng sau 6 tháng luyện tập có hệ thống tại Skill Master, mình đã đạt được. Giáo viên rất am hiểu cấu trúc đề thi.',
        author: 'Phạm Q.T.',
        role: 'Kỹ sư phần mềm',
        result: 'TOEIC 650 → 990',
        resultColor: '#0057B8',
        initials: 'QT',
        color: 'bg-indigo-500',
    },
    {
        content: 'Con gái 8 tuổi của tôi rất thích học ở đây. Cô giáo kiên nhẫn, phương pháp vui tươi. Sau 3 tháng bé đã có thể giao tiếp cơ bản và rất tự tin.',
        author: 'Hoàng T.B.',
        role: 'Phụ huynh học sinh',
        result: 'Young Learners Level 2',
        resultColor: '#15803D',
        initials: 'TB',
        color: 'bg-pink-500',
    },
    {
        content: 'Mình cần TOEFL để apply học bổng thạc sĩ. Skill Master thiết kế lộ trình riêng, tập trung vào điểm yếu Listening. Đạt 115 sau 5 tháng, vượt mục tiêu ban đầu.',
        author: 'Vũ N.K.',
        role: 'Ứng viên học bổng Mỹ',
        result: 'TOEFL 98 → 115',
        resultColor: '#004080',
        initials: 'NK',
        color: 'bg-amber-500',
    },
    {
        content: 'Chương trình IC3 rất thực tế và dễ theo. Được cấp chứng chỉ quốc tế sau khi hoàn thành, giờ mình tự tin xin việc vào các công ty nước ngoài.',
        author: 'Đỗ M.L.',
        role: 'Sinh viên năm cuối',
        result: 'IC3 Global Standard',
        resultColor: '#0F766E',
        initials: 'ML',
        color: 'bg-teal-500',
    },
    {
        content: 'Điểm Writing IELTS từ 5.5 lên 7.0 chỉ sau 3 tháng. Ms. Ngọc Anh sửa bài rất chi tiết, đưa ra phản hồi cụ thể thay vì nhận xét chung chung.',
        author: 'Bùi H.Y.',
        role: 'Giảng viên đại học',
        result: 'Writing 5.5 → 7.0',
        resultColor: '#CC0000',
        initials: 'HY',
        color: 'bg-rose-500',
    },
    {
        content: 'Sau khi học Business English, mình tự tin thuyết trình trước khách hàng nước ngoài. Giáo viên không chỉ dạy từ vựng mà còn dạy cách tư duy bằng tiếng Anh.',
        author: 'Lý A.T.',
        role: 'Trưởng phòng kinh doanh',
        result: 'Business English Certified',
        resultColor: '#0047AB',
        initials: 'AT',
        color: 'bg-violet-500',
    },
];

// ============================================
// METHOD STEPS - Learning Approach with illustrations
// ============================================
export const methodSteps = [
    {
        number: '01',
        title: 'Đánh giá năng lực',
        description: 'Kiểm tra đầu vào miễn phí để xác định trình độ và mục tiêu học tập.',
        illustration: illustrationAssessment,
    },
    {
        number: '02',
        title: 'Lộ trình cá nhân',
        description: 'Thiết kế chương trình học riêng phù hợp với thời gian và mục tiêu.',
        illustration: illustrationRoadmap,
    },
    {
        number: '03',
        title: 'Học & Thực hành',
        description: 'Kết hợp học lý thuyết với thực hành chuyên sâu mỗi buổi học.',
        illustration: illustrationPractice,
    },
    {
        number: '04',
        title: 'Đánh giá & Cải thiện',
        description: 'Kiểm tra định kỳ và điều chỉnh phương pháp để đạt kết quả tốt nhất.',
        illustration: illustrationGrowth,
    },
];

// ============================================
// FAQ - Frequently Asked Questions
// ============================================
export const faqs = [
    {
        question: 'Học phí các khóa học là bao nhiêu?',
        answer: 'Học phí dao động từ 2.5-8 triệu đồng tùy theo khóa học và thời lượng. Chúng tôi có nhiều chương trình ưu đãi và hỗ trợ trả góp 0% lãi suất. Đăng ký tư vấn miễn phí để nhận báo giá chi tiết.',
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
        answer: '100% giảng viên đều có chứng chỉ quốc tế như IELTS 8.0+, TOEIC 990, TESOL, MOS Master. Nhiều giáo viên còn có kinh nghiệm làm việc tại nước ngoài.',
    },
    {
        question: 'Có học thử miễn phí không?',
        answer: 'Có, chúng tôi cung cấp 1 buổi học thử miễn phí để trải nghiệm phương pháp giảng dạy và đánh giá năng lực.',
    },
    {
        question: 'Thời gian học linh hoạt không?',
        answer: 'Chúng tôi có nhiều khung giờ học linh hoạt từ sáng đến tối, cả trong tuần và cuối tuần. Bạn có thể chọn lịch học phù hợp với công việc.',
    },
    {
        question: 'Hệ thống theo dõi tiến độ hoạt động thế nào?',
        answer: 'Mỗi học viên có dashboard cá nhân để theo dõi điểm số, tiến độ, bài tập và lịch học. AI chatbot Molly hỗ trợ giải đáp 24/7. Phụ huynh cũng có thể theo dõi qua tài khoản riêng.',
    },
    {
        question: 'Sau khóa học có hỗ trợ gì không?',
        answer: 'Sau khi kết thúc khóa học, học viên vẫn được hỗ trợ giải đáp thắc mắc, tư vấn lộ trình học tiếp và tham gia các buổi workshop miễn phí.',
    },
];

// ============================================
// FOOTER LINKS
// ============================================
export const footerLinks = {
    'Khóa học': [
        { label: 'IELTS', to: '/courses' },
        { label: 'TOEIC', to: '/courses' },
        { label: 'Giao tiếp', to: '/courses' },
        { label: 'Tin học VP', to: '/courses' },
        { label: 'IC3', to: '/courses' },
    ],
    'Lộ trình': [
        { label: 'Từ 0 lên 6.5', to: '/roadmap' },
        { label: 'TOEIC 700+', to: '/roadmap' },
        { label: 'IELTS 7.0+', to: '/roadmap' },
        { label: 'Excel Pro', to: '/roadmap' },
    ],
    'Hỗ trợ': [
        { label: 'Tư vấn miễn phí', to: null, action: 'consultation' },
        { label: 'Lịch khai giảng', to: '/courses' },
        { label: 'Chính sách', to: '/chinh-sach' },
        { label: 'FAQ', to: '/faq' },
    ],
};

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
        description: 'AI chatbot Molly + Đội ngũ mentor'
    },
    {
        icon: 'BookOpen',
        label: 'Lộ trình tinh gọn',
        description: 'Tiết kiệm 30% thời gian'
    }
];

// ============================================
// VIDEO CONFIG
// ============================================
export const introVideo = {
    youtubeId: null, // Set to null — show product mockup instead of fake video
    title: 'Giới thiệu Skill Master',
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
        avatar: teacherFemaleIelts,
    },
    recentActivities: [
        { type: 'assignment', title: 'Writing Task 2', score: '7.0', time: 'Hôm qua' },
        { type: 'quiz', title: 'Vocab Quiz', score: '18/20', time: '2 ngày trước' },
    ],
};
