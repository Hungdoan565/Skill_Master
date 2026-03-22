import React from 'react';
import { Link } from 'react-router-dom';
import { SmartImage } from '@/components/common';
import { Twitter, Linkedin, Mail, Globe, ArrowRight } from 'lucide-react';

// ============================================
// AUTHOR CARD - BIO SECTION
// ============================================
// Displays author information at the end of article
// ============================================

export const AuthorCard = ({ author, postCount = 12 }) => {
    if (!author) return null;

    // Mock bio - in real app, this would come from author data
    const bio = author.bio || `Giảng viên tại Skill Master với nhiều năm kinh nghiệm giảng dạy ${author.role?.includes('IELTS') ? 'IELTS' : author.role?.includes('TOEIC') ? 'TOEIC' : 'Tin học văn phòng'}. Đam mê chia sẻ kiến thức và giúp học viên đạt mục tiêu.`;

    return (
        <section className="py-12 border-t border-b border-border my-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <SmartImage
                        src={author.avatar}
                        alt={author.name}
                        className="rounded-2xl border-4 border-white shadow-xl shadow-black/5 dark:shadow-black/20"
                        containerClassName="w-24 h-24 md:w-32 md:h-32"
                        fit="cover"
                    />
                </div>

                {/* Info */}
                <div className="flex-1">
                    {/* Label */}
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2 block">
                        Tác giả
                    </span>

                    {/* Name */}
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                        {author.name}
                    </h3>

                    {/* Role */}
                    <p className="text-muted-foreground mb-4">{author.role}</p>

                    {/* Bio */}
                    <p className="text-muted-foreground leading-relaxed mb-6 max-w-xl">
                        {bio}
                    </p>

                    {/* Social + More Posts */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Social Icons */}
                        <div className="flex items-center gap-2">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center
                                    text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center
                                    text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center
                                    text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                                aria-label="Email"
                            >
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-8 bg-muted" />

                        {/* More from author */}
                        <Link
                            to={`/blog?author=${encodeURIComponent(author.name)}`}
                            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground 
                                hover:text-red-600 transition-colors"
                        >
                            <span>Xem thêm {postCount} bài viết</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AuthorCard;
