import React from 'react';
import {
  Header, Footer, SEOHead
} from './components';
import {
  HeroSection, StatsSection, CoursesSection, MethodSection,
  TeacherCarousel, TestimonialsSection, FAQSection, CTASection
} from './sections';

// ============================================
// SWISS MINIMALISM LANDING PAGE
// ============================================
// Modular architecture with separated components
// ============================================

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-red-500/20 selection:text-red-900 font-sans">
      <SEOHead
        title="Skill Master - Chinh phục Anh ngữ & Tin học"
        description="Hệ thống đào tạo chuẩn quốc tế, phương pháp học hiện đại, cam kết đầu ra với lộ trình cá nhân hóa cho từng học viên."
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
