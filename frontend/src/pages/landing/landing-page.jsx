import { SEOHead } from '@/components/common';
import {
  HeroSection, ProblemSection, SolutionSection,
  StatsSection, CoursesSection, MethodSection,
  TeacherCarousel, TestimonialsSection, FAQSection, CTASection
} from './sections';
import { Header, Footer } from './components';
import { faqs } from './constants/landing-data';

// ============================================
// SKILL MASTER LANDING PAGE — REVENUE OPTIMIZED
// ============================================
// 10-section conversion funnel:
// 1. Hero (dark)        → First impression + primary CTA
// 2. Problem (warm)     → Empathy + pain points
// 3. Solution (dark)    → Product showcase (bento grid)
// 4. Method (light)     → How it works (4 steps)
// 5. Courses (warm)     → Core offering
// 6. Teachers (light)   → Trust building (AI portraits)
// 7. Stats (dark)       → Social proof numbers
// 8. Testimonials (light) → Student reviews
// 9. FAQ (warm)         → Objection handling
// 10. CTA (dark)        → Final conversion (inline form)
// ============================================

export const LandingPage = () => {
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      'name': 'Skill Master',
      'description': 'Hệ thống quản lý trung tâm đào tạo Anh ngữ & Tin học thế hệ mới. Lộ trình cá nhân hóa, AI chatbot, theo dõi tiến độ real-time.',
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
        'ratingValue': '4.9',
        'reviewCount': '500'
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
        title="Skill Master — Hệ thống quản lý trung tâm đào tạo thế hệ mới"
        description="Quản lý lớp học, theo dõi tiến độ, lộ trình cá nhân hóa — tất cả trong một nền tảng. Dành cho trung tâm Anh ngữ & Tin học."
        schema={structuredData}
      />

      {/* Header & Navigation */}
      <Header />

      <main>
        {/* 1. Hero — Dark: First impression + primary CTA to ConsultationModal */}
        <HeroSection />

        {/* 2. Problem — Warm: Empathy + pain points before selling */}
        <ProblemSection />

        {/* 3. Solution — Dark: Product showcase (bento grid) */}
        <SolutionSection />

        {/* 4. Method — Light: How it works (4 interactive steps) */}
        <MethodSection />

        {/* 5. Courses — Warm: Core offering with quick view modal */}
        <CoursesSection />

        {/* 6. Teachers — Light: Trust building with AI-generated portraits */}
        <TeacherCarousel />

        {/* 7. Stats — Dark: Social proof numbers */}
        <StatsSection />

        {/* 8. Testimonials — Light: Student reviews (initials, not fake photos) */}
        <TestimonialsSection />

        {/* 9. FAQ — Warm: Objection handling */}
        <FAQSection />

        {/* 10. CTA — Dark: Final conversion push (inline form → real API) */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
