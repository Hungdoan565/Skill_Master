import React, { useEffect, useRef, useState } from 'react';
import { SmartImage } from '@/components/common';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Phone, Mail, MapPin,
  MessageCircle, CheckCircle, ChevronDown, Sparkles,
  Clock, Users, Building2, Star, AlertCircle
} from 'lucide-react';
import PublicHeader from '@/components/layout/public-header';
import { SEOHead } from '@/components/common';
import { Footer } from '@/pages/landing/components/footer';
import { validateContactForm, isSpam, submitContactForm } from '@/utils/contactFormUtils';

// Import logo
import logoImage from '@/assets/logo.png';

// ============================================
// CONTACT PAGE - "BOLD HOSPITALITY" DESIGN
// ============================================
// Design Philosophy:
// 1. ONE dominant focal point per section
// 2. Warm undertones (cream, not gray)
// 3. Asymmetric tension that guides the eye
// 4. Interactive delight (hover reveals, smooth transitions)
// 5. Narrative flow: Hook → Trust → Convince → Convert
// 
// Color System:
// - Primary: #FF4D00 (action, urgency)
// - Ink: #1a1a1a (confident, not harsh)
// - Cream: #FAF9F7 (warm, inviting)
// - Stone: #E8E6E3 (subtle structure)
// ============================================

// Intersection Observer hook
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
};

// ============================================
// HERO - "LEAD CONVERSION" ARCHITECTURE
// Left: Clean Input Form (The Action Zone)
// Right: Trust + Contact Info (The Validation Zone)
// ============================================
const HeroSection = () => {
  const [ref, isInView] = useInView();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    honeypot: '' // Spam protection - hidden field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Clear field error when user types
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    setSubmitError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Spam check - if honeypot is filled, silently "succeed"
    if (isSpam(formData.honeypot)) {
      setSubmitted(true);
      return;
    }

    // Validate form
    const { isValid, errors: validationErrors } = validateContactForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Submit to backend
    const result = await submitContactForm(formData, 'contact-hero');

    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setSubmitError(result.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <section ref={ref} className="pt-20 min-h-screen relative overflow-hidden">
      {/* Background: Asymmetric split */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-full lg:w-[45%] h-full bg-neutral-900" />
      </div>

      <div className="max-w-[1600px] mx-auto relative">
        <div className="grid lg:grid-cols-12 min-h-[calc(100vh-80px)]">

          {/* ========================================
              LEFT PANEL: "THE INPUT ZONE"
              Clean form, ample whitespace, no distractions
              ======================================== */}
          <div className="lg:col-span-7 relative p-8 lg:p-16 xl:p-20 flex flex-col justify-center bg-card">

            <div className={`relative z-10 max-w-xl transform transition-all duration-1000
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>

              {/* Section Label */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-px bg-[#FF4D00]" />
                <span className="text-xs font-medium tracking-[0.25em] uppercase text-neutral-400">
                  Liên hệ
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.15] mb-4">
                Gửi tin nhắn
                <br />
                <span className="text-neutral-400">cho chúng tôi</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-10 max-w-md">
                Điền thông tin bên dưới, chúng tôi sẽ liên hệ bạn trong vòng 24 giờ.
              </p>

              {/* Form */}
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Đã gửi thành công!</h3>
                  <p className="text-muted-foreground mb-6">Chúng tôi sẽ liên hệ bạn trong thời gian sớm nhất.</p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', message: '' });
                    }}
                    className="text-[#FF4D00] font-medium hover:underline"
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot - Hidden from users, visible to bots */}
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={(e) => handleInputChange('honeypot', e.target.value)}
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Họ và tên <span className="text-[#FF4D00]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3.5 bg-card border rounded-xl transition-all
                               ${errors.name
                          ? 'border-red-400 ring-2 ring-red-100'
                          : focusedField === 'name'
                            ? 'border-[#FF4D00] ring-2 ring-[#FF4D00]/20'
                            : 'border-gray-200 hover:border-gray-300'}`}
                      placeholder="Nguyễn Văn A"
                      aria-invalid={errors.name ? 'true' : 'false'}
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email & Phone - 2 columns */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Email <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3.5 bg-card border rounded-xl transition-all
                                 ${errors.email
                            ? 'border-red-400 ring-2 ring-red-100'
                            : focusedField === 'email'
                              ? 'border-[#FF4D00] ring-2 ring-[#FF4D00]/20'
                              : 'border-gray-200 hover:border-gray-300'}`}
                        placeholder="email@example.com"
                        aria-invalid={errors.email ? 'true' : 'false'}
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Số điện thoại <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3.5 bg-card border rounded-xl transition-all
                                 ${errors.phone
                            ? 'border-red-400 ring-2 ring-red-100'
                            : focusedField === 'phone'
                              ? 'border-[#FF4D00] ring-2 ring-[#FF4D00]/20'
                              : 'border-gray-200 hover:border-gray-300'}`}
                        placeholder="0901 234 567"
                        aria-invalid={errors.phone ? 'true' : 'false'}
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Lời nhắn
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full px-4 py-3.5 bg-card border rounded-xl transition-all resize-none
                               ${focusedField === 'message'
                          ? 'border-[#FF4D00] ring-2 ring-[#FF4D00]/20'
                          : 'border-gray-200 hover:border-gray-300'}`}
                      placeholder="Bạn quan tâm đến khóa học nào? Mục tiêu của bạn là gì?"
                    />
                  </div>

                  {/* Submit Error Message */}
                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-medium">Không thể gửi form</p>
                        <p className="text-red-600 text-sm">{submitError}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button - Full Width, Orange */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#FF4D00] text-white font-semibold text-lg
                             hover:bg-[#e64500] active:bg-[#cc3d00] transition-colors
                             disabled:opacity-70 disabled:cursor-not-allowed
                             flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <span>Gửi ngay</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {/* Privacy note */}
                  <p className="text-xs text-neutral-400 text-center">
                    Bằng việc gửi form, bạn đồng ý với <a href="#" className="underline hover:text-muted-foreground">Chính sách bảo mật</a> của chúng tôi.
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* ========================================
              RIGHT PANEL: "THE TRUST & INFO ZONE"
              Response time hook + All contact methods + Testimonial
              ======================================== */}
          <div className="lg:col-span-5 relative bg-neutral-900 p-8 lg:p-12 xl:p-16 flex flex-col text-white">

            {/* Top: Online Status */}
            <div className={`relative flex items-center gap-3 mb-8 transform transition-all duration-700 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-sm text-green-400 font-medium">Đang trực tuyến</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">Mở cửa đến 21:00</span>
            </div>

            {/* The Hook: Response Time */}
            <div className={`mb-10 transform transition-all duration-1000 delay-200
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-xs uppercase tracking-[0.2em] text-[#FF4D00] font-medium mb-3">
                Cam kết phản hồi
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-7xl lg:text-8xl xl:text-9xl font-black leading-none tracking-tighter">
                  &lt;24
                </span>
                <span className="text-3xl font-bold text-muted-foreground">giờ</span>
              </div>
              <p className="text-muted-foreground mt-3">
                Thực tế trung bình chỉ <span className="text-white font-semibold">4 giờ</span>
              </p>
            </div>

            {/* Contact Methods - Info Cards */}
            <div className={`space-y-3 mb-10 transform transition-all duration-1000 delay-300
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-4">
                Hoặc liên hệ trực tiếp
              </p>

              {/* Hotline Card */}
              <a
                href="tel:19001234"
                className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 
                         border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-[#FF4D00] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Hotline 24/7</p>
                  <p className="text-lg font-semibold">1900 1234</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
              </a>

              {/* Email Card */}
              <a
                href="mailto:info@skillmaster.edu.vn"
                className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 
                         border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-neutral-800 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="text-lg font-semibold">info@skillmaster.edu.vn</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
              </a>

              {/* Zalo Card */}
              <a
                href="https://zalo.me/skillmaster"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 
                         border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-neutral-800 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Zalo OA</p>
                  <p className="text-lg font-semibold">Chat ngay</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
              </a>
            </div>

            {/* Testimonial - Compact */}
            <div className={`mt-auto pt-8 border-t border-neutral-800 transform transition-all duration-1000 delay-400
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <p className="text-neutral-400 leading-relaxed italic mb-4">
                "Tôi gửi form lúc 10h sáng, 2 tiếng sau đã được gọi tư vấn chi tiết. Rất ấn tượng!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                  <span className="text-sm font-bold text-neutral-400">TH</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">Trần Hoàng</p>
                  <p className="text-xs text-muted-foreground">Học viên IELTS 7.5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


// NOTE: ContactFormSection was removed as it was unused dead code.
// The HeroSection now contains the main contact form with proper validation.

// ============================================
// LOCATIONS - "IMMERSIVE GALLERY" STYLE
// Design: Image + Info split, Embedded maps, Creative hover
// ============================================
const LocationsSection = () => {
  const [ref, isInView] = useInView();
  const [activeLocation, setActiveLocation] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  const locations = [
    {
      id: 'q1',
      name: 'Quận 1',
      type: 'Flagship Center',
      address: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1',
      phone: '028 1234 5678',
      hours: 'T2 - CN: 08:00 - 21:00',
      features: ['20 phòng học hiện đại', 'Lab 40 máy tính', 'Thư viện mở 24/7', 'Cafe sách'],
      // Placeholder image - replace with actual
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4241674197956!2d106.70142007469865!3d10.778789389387898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f38f9ed887b%3A0x14aded5703768989!2zTmd1eeG7hW4gSHXhu4csIELhur9uIE5naMOpLCBRdeG6rW4gMSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s',
      highlight: 'Trung tâm lớn nhất',
    },
    {
      id: 'q7',
      name: 'Quận 7',
      type: 'Campus',
      address: '456 Nguyễn Thị Thập, P. Tân Phong, Quận 7',
      phone: '028 2345 6789',
      hours: 'T2 - T7: 08:00 - 20:00',
      features: ['15 phòng học', 'Lab 30 máy tính', 'Canteen', 'Khu vực tự học'],
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop',
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3920.0262395983856!2d106.7197!3d10.7359!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ0JzA5LjIiTiAxMDbCsDQzJzEwLjkiRQ!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s',
      highlight: 'Gần Lotte Mart',
    },
    {
      id: 'bt',
      name: 'Bình Thạnh',
      type: 'Mới khai trương',
      address: '789 Điện Biên Phủ, P. 25, Bình Thạnh',
      phone: '028 3456 7890',
      hours: 'T2 - T7: 08:00 - 20:00',
      features: ['18 phòng học', 'Lab 35 máy tính', 'Bãi xe miễn phí', 'Phòng tự học 24/7'],
      image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0!2d106.71!3d10.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ4JzAwLjAiTiAxMDbCsDQyJzM2LjAiRQ!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s',
      highlight: 'Ưu đãi khai trương',
      isNew: true,
    },
  ];

  return (
    <section ref={ref} className="border-t border-neutral-900 bg-background">
      <div className="max-w-[1600px] mx-auto">

        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-border">
          <div className="lg:col-span-4 p-8 lg:p-12 lg:border-r border-border">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#FF4D00]" />
              <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
                03 — Địa điểm
              </span>
            </div>
          </div>
          <div className={`lg:col-span-8 p-8 lg:p-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                Ghé thăm
                <span className="text-neutral-400"> chúng tôi</span>
              </h2>
              <p className="text-muted-foreground mt-4 max-w-md">
                3 cơ sở hiện đại tại các vị trí trung tâm TP.HCM, thuận tiện di chuyển.
              </p>
            </div>
            {/* Location Tabs */}
            <div className="flex gap-2">
              {locations.map((loc, i) => (
                <button
                  key={loc.id}
                  onClick={() => setActiveLocation(i)}
                  className={`px-4 py-2 text-sm font-medium transition-colors
                           ${activeLocation === i
                      ? 'bg-neutral-900 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-neutral-200'}`}
                >
                  {loc.name}
                  {loc.isNew && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-[#FF4D00] text-white">
                      MỚI
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location Detail - Image + Info Split */}
        {locations.map((loc, i) => (
          <div
            key={loc.id}
            className={`transition-all duration-500 ${activeLocation === i ? 'block' : 'hidden'}`}
          >
            <div className="grid lg:grid-cols-2">

              {/* Left: Image + Map */}
              <div className="relative group">
                {/* Main Image */}
                <div className="aspect-[4/3] lg:aspect-auto lg:h-full relative overflow-hidden">
                  <SmartImage
                    src={loc.image}
                    alt={`Skill Master ${loc.name}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    containerClassName="w-full h-full"
                    aspectRatio="aspect-video"
                  />

                  {/* Image Overlay on Hover - Shows Map */}
                  <div className="absolute inset-0 bg-neutral-900/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-[#FF4D00]" />
                      <p className="text-xl font-bold mb-2">Xem bản đồ</p>
                      <p className="text-neutral-400 text-sm">Di chuột ra để xem ảnh</p>
                    </div>
                  </div>

                  {/* Highlight Badge */}
                  <div className="absolute top-6 left-6">
                    <div className={`px-4 py-2 text-sm font-medium
                                  ${loc.isNew ? 'bg-[#FF4D00] text-white' : 'bg-card text-foreground'}`}>
                      {loc.highlight}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Info */}
              <div className="p-8 lg:p-12 xl:p-16 flex flex-col justify-between bg-[#FAF9F7]">

                {/* Top: Main Info */}
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#FF4D00] font-medium">
                    {loc.type}
                  </span>
                  <h3 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight mt-4 mb-6">
                    {loc.name}
                  </h3>

                  {/* Contact Info Grid */}
                  <div className="grid gap-6">
                    <div className="flex items-start gap-4 p-4 bg-card">
                      <MapPin className="w-5 h-5 text-[#FF4D00] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">Địa chỉ</p>
                        <p className="text-foreground font-medium">{loc.address}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <a
                        href={`tel:${loc.phone.replace(/\s/g, '')}`}
                        className="flex items-start gap-4 p-4 bg-card hover:bg-muted transition-colors group"
                      >
                        <Phone className="w-5 h-5 text-neutral-400 group-hover:text-[#FF4D00] transition-colors mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">Điện thoại</p>
                          <p className="text-foreground font-medium">{loc.phone}</p>
                        </div>
                      </a>

                      <div className="flex items-start gap-4 p-4 bg-card">
                        <Clock className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">Giờ mở cửa</p>
                          <p className="text-foreground font-medium">{loc.hours}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-8">
                    <p className="text-xs uppercase tracking-widest text-neutral-400 mb-4">Tiện ích</p>
                    <div className="flex flex-wrap gap-2">
                      {loc.features.map(f => (
                        <span
                          key={f}
                          className="px-3 py-2 bg-neutral-900 text-white text-sm"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom: Actions */}
                <div className="mt-8 pt-8 border-t border-border flex flex-wrap gap-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 px-6 py-4 bg-neutral-900 text-white
                             hover:bg-[#FF4D00] transition-colors"
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">Chỉ đường</span>
                    <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <a
                    href={`tel:${loc.phone.replace(/\s/g, '')}`}
                    className="group inline-flex items-center gap-3 px-6 py-4 border-2 border-neutral-900 text-foreground
                             hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="font-semibold">Gọi ngay</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="h-[300px] lg:h-[400px] border-t border-border">
              <iframe
                src={loc.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Bản đồ ${loc.name}`}
                className="grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        ))}

        {/* Quick Navigation Cards - Always visible */}
        <div className="grid lg:grid-cols-3 border-t border-neutral-900">
          {locations.map((loc, i) => (
            <button
              key={loc.id}
              onClick={() => setActiveLocation(i)}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative p-6 lg:p-8 text-left border-r border-border last:border-r-0 
                       transition-all duration-500 group overflow-hidden
                       ${activeLocation === i ? 'bg-neutral-900 text-white' : 'bg-card hover:bg-muted'}`}
            >
              {/* Hover Effect - Sliding background */}
              <div className={`absolute inset-0 bg-[#FF4D00] transition-transform duration-500
                           ${hoveredCard === i && activeLocation !== i ? 'translate-y-0' : 'translate-y-full'}`} />

              <div className="relative flex items-center justify-between">
                <div>
                  <span className={`text-xs uppercase tracking-widest mb-2 block
                                ${activeLocation === i ? 'text-[#FF4D00]' : 'text-neutral-400'}
                                ${hoveredCard === i && activeLocation !== i ? 'text-white/80' : ''}`}>
                    {loc.type}
                  </span>
                  <h4 className={`text-2xl font-bold
                              ${activeLocation === i ? 'text-white' : 'text-foreground'}
                              ${hoveredCard === i && activeLocation !== i ? 'text-white' : ''}`}>
                    {loc.name}
                  </h4>
                  <p className={`text-sm mt-2
                             ${activeLocation === i ? 'text-neutral-400' : 'text-muted-foreground'}
                             ${hoveredCard === i && activeLocation !== i ? 'text-white/80' : ''}`}>
                    {loc.address.split(',')[0]}
                  </p>
                </div>

                <div className={`w-10 h-10 flex items-center justify-center transition-all
                             ${activeLocation === i
                    ? 'bg-[#FF4D00] text-white'
                    : 'bg-muted text-neutral-400 group-hover:bg-card group-hover:text-[#FF4D00]'}
                             ${hoveredCard === i && activeLocation !== i ? 'bg-card text-[#FF4D00]' : ''}`}>
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              {/* Active indicator */}
              {activeLocation === i && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF4D00]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// FAQ - INTERACTIVE + VISUAL INTEREST
// Design: Number accents + Smooth reveals + Clear hierarchy
// ============================================
const FAQSection = () => {
  const [ref, isInView] = useInView();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Làm sao để đăng ký học thử miễn phí?',
      a: 'Bạn có thể đăng ký qua form trên website, gọi hotline 1900 1234, hoặc đến trực tiếp cơ sở gần nhất. Chúng tôi sẽ liên hệ để xếp lịch trong vòng 24 giờ làm việc.',
      highlight: true
    },
    {
      q: 'Học phí các khóa học như thế nào?',
      a: 'Học phí dao động từ 3-8 triệu/khóa tùy theo chương trình và thời lượng. Chúng tôi hỗ trợ trả góp 0% qua các ngân hàng đối tác và nhiều ưu đãi cho học viên đăng ký sớm.'
    },
    {
      q: 'Có cam kết đầu ra không?',
      a: 'Có. Skill Master cam kết đầu ra bằng văn bản cho tất cả các khóa học chính quy. Nếu không đạt mục tiêu cam kết, học viên được học lại hoàn toàn miễn phí.'
    },
    {
      q: 'Lịch học có linh hoạt không?',
      a: 'Lịch học rất linh hoạt với nhiều ca trong ngày: sáng (8:00-10:00), chiều (14:00-16:00, 16:00-18:00), tối (18:30-20:30). Học viên có thể đổi ca khi cần thiết.'
    },
    {
      q: 'Tôi có thể bảo lưu khóa học không?',
      a: 'Có. Bạn có thể bảo lưu tối đa 2 lần trong suốt khóa học, mỗi lần tối đa 30 ngày. Thời gian bảo lưu không tính vào thời hạn cam kết đầu ra.'
    },
  ];

  return (
    <section ref={ref} className="border-t border-neutral-900 bg-[#FAF9F7]">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12">

          {/* Left - Header with Visual Interest */}
          <div className="lg:col-span-4 p-8 lg:p-12 lg:border-r border-border">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-[#FF4D00]" />
                <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
                  04 — FAQ
                </span>
              </div>

              <h2 className={`text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6
                           transform transition-all duration-500
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                Hỏi
                <br />
                <span className="text-neutral-400">đáp</span>
              </h2>

              <p className={`text-muted-foreground leading-relaxed mb-8
                          transform transition-all duration-500 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                Câu trả lời cho những thắc mắc phổ biến nhất. Không tìm thấy?
                <a href="tel:19001234" className="text-[#FF4D00] hover:underline ml-1">
                  Gọi ngay cho chúng tôi.
                </a>
              </p>

              {/* Quick Stats */}
              <div className={`p-6 bg-card border-l-4 border-[#FF4D00]
                           transform transition-all duration-500 delay-200
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <p className="text-4xl font-bold text-foreground">95%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  câu hỏi được giải đáp trong lần đầu tiên
                </p>
              </div>
            </div>
          </div>

          {/* Right - Accordion */}
          <div className="lg:col-span-8 py-4 lg:py-8">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`border-b border-border last:border-b-0 
                          transform transition-all duration-500
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${100 + i * 50}ms` }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                  className={`w-full p-6 lg:p-8 text-left flex items-start gap-6 transition-colors
                           ${openIndex === i ? 'bg-card' : 'hover:bg-white/50'}`}
                >
                  {/* Number */}
                  <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center shrink-0 transition-colors
                                ${openIndex === i ? 'bg-[#FF4D00] text-white' : 'bg-neutral-200 text-muted-foreground'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Question + Icon */}
                  <div className="flex-1 flex items-start justify-between gap-4">
                    <span className={`text-lg font-medium transition-colors
                                  ${openIndex === i ? 'text-foreground' : 'text-neutral-700'}`}>
                      {faq.q}
                      {faq.highlight && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-[#FF4D00]/10 text-[#FF4D00] align-middle">
                          PHỔ BIẾN
                        </span>
                      )}
                    </span>
                    <span className={`w-6 h-6 flex items-center justify-center shrink-0
                                   transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    </span>
                  </div>
                </button>

                {/* Answer */}
                <div className={`overflow-hidden transition-all duration-300 ease-out
                             ${openIndex === i ? 'max-h-48' : 'max-h-0'}`}>
                  <div className="px-6 lg:px-8 pb-6 lg:pb-8 pl-20 lg:pl-[88px]">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// CTA - EMOTIONAL + URGENT
// Design: Contrast + Testimonial + Clear next step
// ============================================
const CTASection = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="border-t border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className={`grid lg:grid-cols-2
                      transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

          {/* Left - Testimonial + Emotional Hook */}
          <div className="p-8 lg:p-16 xl:p-20 bg-neutral-900 text-white flex flex-col justify-between min-h-[50vh]">

            {/* Section indicator */}
            <div className="flex items-center gap-3 mb-auto">
              <div className="w-2 h-2 bg-[#FF4D00]" />
              <span className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">
                05 — Bắt đầu
              </span>
            </div>

            {/* Quote */}
            <div className="my-8 lg:my-12">
              <blockquote className="text-2xl lg:text-3xl font-medium leading-relaxed mb-8">
                "Tôi đã đắn đo rất lâu trước khi quyết định. Giờ thì chỉ tiếc là không bắt đầu sớm hơn."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center">
                  <span className="text-sm font-bold">TH</span>
                </div>
                <div>
                  <p className="font-medium">Trần Hoàng</p>
                  <p className="text-sm text-neutral-400">Học viên IELTS 7.5</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-neutral-800 mt-auto">
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-[#FF4D00]">10K+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Học viên</p>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold">98%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Hài lòng</p>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold">5 năm</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Kinh nghiệm</p>
              </div>
            </div>
          </div>

          {/* Right - CTA */}
          <div className="p-8 lg:p-16 xl:p-20 bg-[#FF4D00] text-white flex flex-col justify-center relative overflow-hidden">

            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-20 -top-20 w-64 h-64 border-[40px] border-white rounded-full" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 border-[20px] border-white rounded-full" />
            </div>

            <div className="relative">
              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                Sẵn sàng
                <br />
                thay đổi?
              </h2>

              <p className="text-lg text-white/80 mb-12 max-w-md">
                Đăng ký học thử miễn phí và trải nghiệm phương pháp giảng dạy của Skill Master.
              </p>

              {/* Primary CTA */}
              <Link
                to="/register"
                className="group flex items-center justify-between p-6 bg-card text-foreground
                         hover:bg-neutral-900 hover:text-white transition-colors mb-4"
              >
                <div>
                  <p className="text-xl font-bold">Đăng ký học thử</p>
                  <p className="text-sm text-muted-foreground group-hover:text-neutral-400">
                    Miễn phí • Không cam kết
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>

              {/* Secondary - Call */}
              <a
                href="tel:19001234"
                className="group flex items-center justify-between p-6 border-2 border-white/30
                         hover:border-white hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">Hoặc gọi: 1900 1234</span>
                </div>
                <ArrowUpRight className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


// ============================================
// MAIN COMPONENT
// ============================================
export const ContactPage = () => {
  return (
    <div className="min-h-screen bg-card antialiased">
      <SEOHead
        title="Liên hệ"
        description="Liên hệ với Skill Master để được tư vấn lộ trình học IELTS, TOEIC và Tin học văn phòng cá nhân hóa. Chúng tôi luôn sẵn sàng hỗ trợ bạn."
      />
      <PublicHeader />
      <main>
        <HeroSection />
        <LocationsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
