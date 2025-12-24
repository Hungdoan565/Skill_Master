import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Facebook, Youtube, Instagram, Linkedin,
    ArrowRight, Mail, Phone, MapPin,
    Shield, Award, Users, BookOpen
} from 'lucide-react';
import { footerLinks, trustBadges } from '../constants/landing-data';
import { useInView } from '../hooks/use-in-view';
import logoImage from '@/assets/logo.png';

// Icon mapping for Trust Badges
const iconMap = {
    Shield, Award, Users, BookOpen
};

export const Footer = () => {
    const [ref, isInView] = useInView();
    const [email, setEmail] = useState('');

    const handleSubscribe = (e) => {
        e.preventDefault();
        alert(`Đã đăng ký nhận tin với email: ${email}`);
        setEmail('');
    };

    return (
        <footer ref={ref} className="bg-zinc-950 text-stone-400 border-t border-white/10 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />

            {/* Trust Strip - Phase 3 */}
            <div className="border-b border-white/5 relative z-10">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
                        {trustBadges.map((badge, idx) => {
                            const Icon = iconMap[badge.icon];
                            return (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-stone-200 font-bold">{badge.label}</p>
                                        <p className="text-xs text-stone-500 group-hover:text-stone-400 transition-colors">{badge.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 pb-12 relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8">

                    {/* Brand Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link to="/" className="inline-block group">
                            <img src={logoImage} alt="Skill Master Logo" className="h-16 w-auto object-contain brightness-0 invert opacity-50 group-hover:opacity-100 transition-all duration-300" />
                        </Link>
                        <p className="text-stone-400 leading-relaxed max-w-sm">
                            Hệ thống đào tạo Anh ngữ & Tin học chuẩn quốc tế.
                            Cam kết chất lượng đào tạo và đầu ra bằng văn bản.
                        </p>

                        <div className="flex gap-4 pt-2">
                            {[Facebook, Youtube, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {Object.entries(footerLinks).map(([category, links]) => (
                            <div key={category}>
                                <h4 className="font-bold text-white mb-6 select-none">{category}</h4>
                                <ul className="space-y-4">
                                    {links.map((link, idx) => (
                                        <li key={idx}>
                                            <Link to="#" className="text-sm hover:text-red-500 transition-colors inline-flex items-center gap-1 group">
                                                <span className="w-0 overflow-hidden group-hover:w-3 transition-all duration-300 opacity-0 group-hover:opacity-100">
                                                    <ArrowRight className="w-3 h-3" />
                                                </span>
                                                {link}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Contact & Newsletter Column - RESTRUCTURED */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Contact Info */}
                        <div>
                            <h4 className="font-bold text-white mb-6">Liên hệ</h4>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 text-sm hover:text-white transition-colors group">
                                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <span>Tầng 5, Tòa nhà TechHub, Cầu Giấy, Hà Nội</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm hover:text-white transition-colors group">
                                    <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span>Hotline: 1900 6868 (8:00 - 21:00)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm hover:text-white transition-colors group">
                                    <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span>tuyensinh@skillmaster.vn</span>
                                </div>
                            </div>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <h4 className="font-bold text-white mb-4">Nhận tin tức</h4>
                            <p className="text-sm text-stone-400 mb-4">
                                Tài liệu học miễn phí hàng tuần.
                            </p>
                            <form onSubmit={handleSubscribe} className="space-y-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-stone-500" />
                                    <input
                                        type="email"
                                        placeholder="Email của bạn"
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-stone-600 focus:outline-none focus:border-red-500 transition-colors"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full py-3 bg-white text-zinc-950 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                                    Đăng ký ngay
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 mt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
                    <p>© 2024 Skill Master Academy. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
                        <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
                        <a href="#" className="hover:text-white transition-colors">Sitemap</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
