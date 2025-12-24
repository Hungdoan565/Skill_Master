import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '@/assets/logo.png';
import { footerLinks } from '../constants/landing-data';

export const Footer = () => {
    return (
        <footer className="bg-stone-50 border-t border-stone-200 py-20">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2">
                            <img
                                src={logoImage}
                                alt="Skill Master Logo"
                                className="h-12 w-auto object-contain"
                            />
                        </Link>
                        <p className="mt-4 text-zinc-500 max-w-sm leading-relaxed">
                            Trung tâm đào tạo Anh ngữ & Tin học uy tín.
                            Cam kết đầu ra - Lộ trình cá nhân - Giáo viên chuyên nghiệp.
                        </p>
                        <div className="mt-6 flex gap-4">
                            {['Facebook', 'YouTube', 'Zalo'].map(social => (
                                <a
                                    key={social}
                                    href="#"
                                    className="w-10 h-10 bg-white rounded-full border border-stone-200
                           flex items-center justify-center text-zinc-600
                           hover:bg-zinc-900 hover:text-white hover:border-zinc-900
                           transition-all"
                                    aria-label={social}
                                >
                                    <span className="text-xs font-medium">{social[0]}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="font-semibold text-zinc-900 mb-4">{title}</h4>
                            <ul className="space-y-3">
                                {links.map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-16 pt-8 border-t border-stone-200 flex flex-col sm:flex-row 
                      justify-between items-center gap-4">
                    <p className="text-sm text-zinc-500">
                        © 2025 Skill Master. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                            Điều khoản sử dụng
                        </a>
                        <a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                            Chính sách bảo mật
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
