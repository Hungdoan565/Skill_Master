import { SEOHead } from '@/components/common';
import {
  HeroSection, StatsSection, CoursesSection, MethodSection,
  TeacherCarousel, TestimonialsSection, FAQSection, CTASection
} from './sections';
import { faqs } from './constants/landing-data';

// ============================================
// SWISS MINIMALISM LANDING PAGE
// ============================================
// Modular architecture with separated components
// ============================================

export const LandingPage = () => {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      'name': 'Skill Master',
      'description': 'Hệ thống đào tạo Anh ngữ & Tin học chuẩn quốc tế với lộ trình cá nhân hóa.',
      'url': 'https://skillmaster.vn',
      'telephone': '1900-xxxx',
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
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-red-500/20 selection:text-red-900 font-sans">
      <SEOHead
        title="Skill Master - Chinh phục Anh ngữ & Tin học"
        description="Hệ thống đào tạo chuẩn quốc tế, phương pháp học hiện đại, cam kết đầu ra với lộ trình cá nhân hóa cho từng học viên."
        schema={structuredData}
      />

      {/* Header & Navigation */}
      <Header />

      <main>
        {/* Hero Section - First Impression */}
        <HeroSection />

        {/* Stats Section - Social Proof */}
        <StatsSection />

        {/* Courses Section - Core Offering (Interactive) */}
        <CoursesSection />

        {/* Method Section - Unique Selling Point (Interactive) */}
        <MethodSection />

        {/* Teachers Section - Trust Building */}
        <TeacherCarousel />

        {/* Testimonials Section - Reviews */}
        <TestimonialsSection />

        {/* FAQ Section - Handling Objections */}
        <FAQSection />

        {/* CTA Section - Final Conversion Push */}
        <CTASection />
      </main>

      {/* Footer - Navigation & Info */}
      <Footer />
    </div>
  );
};
