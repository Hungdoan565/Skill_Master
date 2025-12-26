import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sparkles,
    ArrowRight,
    Star,
    Users,
    Clock,
    TrendingUp,
    Award,
    Zap
} from 'lucide-react';

// ============================================
// SCROLL-TO-TOP LINK COMPONENT
// ============================================
const ScrollLink = ({ to, children, className }) => {
    const navigate = useNavigate();

    const handleClick = (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'instant' });
        navigate(to);
    };

    return (
        <a href={to} onClick={handleClick} className={className}>
            {children}
        </a>
    );
};

// ============================================
// COURSE DATA BY CATEGORY
// ============================================
const COURSE_RECOMMENDATIONS = {
    IELTS: {
        title: 'Khóa học IELTS Intensive',
        subtitle: 'Lộ trình cam kết đầu ra 7.0+',
        description: 'Học 1-1 với giáo viên 8.0+ IELTS. Phương pháp học tập khoa học, cam kết kết quả.',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600',
        badge: 'Best Seller',
        rating: 4.9,
        students: 2847,
        duration: '3 tháng',
        originalPrice: 8900000,
        salePrice: 5900000,
        slug: '/courses/ielts-intensive',
        features: ['Cam kết 7.0+', '1-1 với IELTS 8.0+', 'Học lại miễn phí']
    },
    TOEIC: {
        title: 'TOEIC 700+ Guarantee',
        subtitle: 'Chinh phục TOEIC trong 2 tháng',
        description: 'Phương pháp học tối ưu cho người đi làm. Lịch học linh hoạt, tài liệu độc quyền.',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600',
        badge: 'Hot',
        rating: 4.8,
        students: 3521,
        duration: '2 tháng',
        originalPrice: 6900000,
        salePrice: 4500000,
        slug: '/courses/toeic-700',
        features: ['Cam kết 700+', 'Lịch linh hoạt', 'Tài liệu ETS chính hãng']
    },
    IT: {
        title: 'Excel & Office Master',
        subtitle: 'Thành thạo Excel trong 30 ngày',
        description: 'Từ cơ bản đến nâng cao. Ứng dụng thực tế cho công việc văn phòng.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
        badge: 'New',
        rating: 4.7,
        students: 1893,
        duration: '1 tháng',
        originalPrice: 2900000,
        salePrice: 1490000,
        slug: '/courses/excel-master',
        features: ['50+ bài tập thực hành', 'Template sẵn có', 'Hỗ trợ 24/7']
    },
    default: {
        title: 'Khám phá các khóa học',
        subtitle: 'Nâng cao kỹ năng của bạn',
        description: 'Hàng trăm khóa học chất lượng cao đang chờ bạn khám phá.',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600',
        badge: 'Explore',
        rating: 4.8,
        students: 15000,
        duration: 'Đa dạng',
        originalPrice: null,
        salePrice: null,
        slug: '/courses',
        features: ['100+ khóa học', 'Giáo viên hàng đầu', 'Chứng chỉ hoàn thành']
    }
};

// ============================================
// IN-ARTICLE COURSE CTA
// ============================================
export const InArticleCourseCTA = ({ category }) => {
    const course = COURSE_RECOMMENDATIONS[category] || COURSE_RECOMMENDATIONS.default;

    const discount = course.originalPrice && course.salePrice
        ? Math.round((1 - course.salePrice / course.originalPrice) * 100)
        : null;

    const formatPrice = (price) => {
        if (!price) return null;
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    return (
        <div className="my-12 rounded-3xl bg-gradient-to-br from-stone-900 via-zinc-900 to-stone-900 
            overflow-hidden shadow-2xl relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="relative flex flex-col lg:flex-row">
                {/* Image */}
                <div className="lg:w-2/5 h-48 lg:h-auto relative">
                    <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-stone-900/80 
                        hidden lg:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent 
                        lg:hidden" />

                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold 
                            rounded-full flex items-center gap-1.5 shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            {course.badge}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="lg:w-3/5 p-6 lg:p-8 flex flex-col justify-center">
                    {/* Subtitle */}
                    <p className="text-red-400 text-sm font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {course.subtitle}
                    </p>

                    {/* Title */}
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                        {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-stone-400 text-sm mb-4 line-clamp-2">
                        {course.description}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 mb-5 text-sm">
                        <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-semibold">{course.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-400">
                            <Users className="w-4 h-4" />
                            <span>{course.students.toLocaleString()} học viên</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-400">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}</span>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {course.features.map((feature, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 bg-white/10 text-white/80 text-xs 
                                    rounded-full flex items-center gap-1"
                            >
                                <Zap className="w-3 h-3 text-amber-400" />
                                {feature}
                            </span>
                        ))}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex flex-wrap items-center gap-4">
                        {course.salePrice && (
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-white">
                                    {formatPrice(course.salePrice)}
                                </span>
                                {course.originalPrice && (
                                    <span className="text-sm text-stone-500 line-through">
                                        {formatPrice(course.originalPrice)}
                                    </span>
                                )}
                                {discount && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs 
                                        font-bold rounded">
                                        -{discount}%
                                    </span>
                                )}
                            </div>
                        )}

                        <ScrollLink
                            to={course.slug}
                            className="group px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 
                                text-white font-semibold rounded-xl hover:shadow-lg 
                                hover:shadow-red-500/30 transition-all flex items-center gap-2"
                        >
                            Xem khóa học
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </ScrollLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// SIDEBAR COURSE CTA (Compact version)
// ============================================
export const SidebarCourseCTA = ({ category }) => {
    const course = COURSE_RECOMMENDATIONS[category] || COURSE_RECOMMENDATIONS.default;

    return (
        <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5" />
                <span className="text-sm font-semibold opacity-90">Khóa học đề xuất</span>
            </div>

            <h4 className="font-bold text-lg mb-2">{course.title}</h4>

            <p className="text-sm opacity-80 mb-4 line-clamp-2">
                {course.description}
            </p>

            <ScrollLink
                to={course.slug}
                className="block w-full py-2.5 bg-white text-red-600 font-semibold 
                    text-center rounded-xl hover:bg-red-50 transition-colors"
            >
                Tìm hiểu thêm
            </ScrollLink>
        </div>
    );
};

// ============================================
// END-OF-ARTICLE CTA
// ============================================
export const EndOfArticleCTA = ({ category }) => {
    const course = COURSE_RECOMMENDATIONS[category] || COURSE_RECOMMENDATIONS.default;

    return (
        <div className="bg-stone-50 rounded-2xl p-8 text-center my-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center 
                mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Bạn muốn học sâu hơn?
            </h3>

            <p className="text-zinc-600 mb-6 max-w-md mx-auto">
                Tham gia <strong>{course.title}</strong> để được hướng dẫn bài bản
                và đạt kết quả nhanh chóng.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
                <ScrollLink
                    to={course.slug}
                    className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl 
                        hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                    Xem khóa học
                    <ArrowRight className="w-4 h-4" />
                </ScrollLink>
                <ScrollLink
                    to="/courses"
                    className="px-6 py-3 bg-white text-zinc-600 font-medium rounded-xl 
                        border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                    Xem tất cả khóa học
                </ScrollLink>
            </div>
        </div>
    );
};

export default {
    InArticleCourseCTA,
    SidebarCourseCTA,
    EndOfArticleCTA
};

