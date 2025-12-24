import { useEffect } from 'react';

/**
 * SEO Head Component
 * Manages meta tags for SEO and social media sharing
 */
export const SEOHead = () => {
    useEffect(() => {
        // Set document title
        document.title = 'Skill Master - Chinh phục Anh ngữ & Tin học';

        // Meta description
        const setMetaTag = (name, content, isProperty = false) => {
            const attribute = isProperty ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attribute, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        // Basic SEO
        setMetaTag('description', 'Trung tâm đào tạo Anh ngữ & Tin học uy tín. Cam kết đầu ra - Lộ trình cá nhân - Giáo viên chuyên nghiệp với chứng chỉ quốc tế. Đăng ký học thử miễn phí ngay!');
        setMetaTag('keywords', 'học tiếng anh, IELTS, TOEIC, tin học văn phòng, IC3, MOS, khóa học tiếng anh, học tin học, skill master');
        setMetaTag('author', 'Skill Master');

        // Open Graph (Facebook)
        setMetaTag('og:title', 'Skill Master - Chinh phục Anh ngữ & Tin học một cách bài bản', true);
        setMetaTag('og:description', 'Hệ thống đào tạo chuẩn quốc tế với phương pháp học hiện đại, cam kết đầu ra và lộ trình cá nhân hóa. 2400+ học viên tin tưởng.', true);
        setMetaTag('og:type', 'website', true);
        setMetaTag('og:url', window.location.href, true);
        setMetaTag('og:site_name', 'Skill Master', true);
        setMetaTag('og:locale', 'vi_VN', true);
        // Note: og:image should be added when actual image asset is available
        // setMetaTag('og:image', 'https://skillmaster.vn/assets/og-image.jpg', true);

        // Twitter Card
        setMetaTag('twitter:card', 'summary_large_image');
        setMetaTag('twitter:title', 'Skill Master - Chinh phục Anh ngữ & Tin học');
        setMetaTag('twitter:description', 'Đào tạo Anh ngữ & Tin học với cam kết đầu ra. 98% học viên đạt mục tiêu. Học thử miễn phí!');
        // setMetaTag('twitter:image', 'https://skillmaster.vn/assets/twitter-card.jpg');

        // Additional SEO tags
        setMetaTag('robots', 'index, follow');
        setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        setMetaTag('theme-color', '#DC2626');

        // Structured Data (JSON-LD) for rich snippets
        const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            'name': 'Skill Master',
            'description': 'Trung tâm đào tạo Anh ngữ & Tin học uy tín với cam kết đầu ra',
            'url': window.location.origin,
            'telephone': '1900-xxxx',
            'email': 'info@skillmaster.edu.vn',
            'address': {
                '@type': 'PostalAddress',
                'streetAddress': 'Tầng 5, Tòa nhà ABC, 123 Nguyễn Văn Linh',
                'addressLocality': 'Quận 7',
                'addressRegion': 'TP.HCM',
                'addressCountry': 'VN'
            },
            'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': '4.8',
                'reviewCount': '2400'
            },
            'offers': {
                '@type': 'AggregateOffer',
                'priceCurrency': 'VND',
                'lowPrice': '3000000',
                'highPrice': '8000000'
            }
        };

        let scriptTag = document.querySelector('script[type="application/ld+json"]');
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            document.head.appendChild(scriptTag);
        }
        scriptTag.textContent = JSON.stringify(structuredData);

    }, []);

    return null; // This component doesn't render anything
};
