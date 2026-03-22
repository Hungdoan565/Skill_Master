import React, { useState } from 'react';
import { Facebook, Twitter, Linkedin, Link2, Check, Mail } from 'lucide-react';

// ============================================
// SOCIAL SHARE BUTTONS
// ============================================
export const SocialShare = ({ url, title, description }) => {
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url || window.location.href);
    const encodedTitle = encodeURIComponent(title || '');
    const encodedDescription = encodeURIComponent(description || '');

    const shareLinks = [
        {
            name: 'Facebook',
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
            ariaLabel: 'Chia sẻ lên Facebook'
        },
        {
            name: 'Twitter',
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            color: 'hover:bg-sky-500 hover:text-white hover:border-sky-500',
            ariaLabel: 'Chia sẻ lên Twitter'
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
            color: 'hover:bg-blue-700 hover:text-white hover:border-blue-700',
            ariaLabel: 'Chia sẻ lên LinkedIn'
        },
        {
            name: 'Email',
            icon: Mail,
            href: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
            color: 'hover:bg-zinc-800 hover:text-white hover:border-zinc-800',
            ariaLabel: 'Chia sẻ qua Email'
        },
    ];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url || window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Chia sẻ:</span>
            <div className="flex items-center gap-2">
                {shareLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-10 h-10 rounded-full border border-border 
                            flex items-center justify-center text-muted-foreground
                            transition-all duration-300 ${link.color}`}
                        aria-label={link.ariaLabel}
                    >
                        <link.icon className="w-4 h-4" />
                    </a>
                ))}
                <button
                    onClick={copyToClipboard}
                    className={`w-10 h-10 rounded-full border border-border 
                        flex items-center justify-center transition-all duration-300
                        ${copied
                            ? 'bg-green-500 text-white border-green-500'
                            : 'text-muted-foreground hover:bg-zinc-800 hover:text-white hover:border-zinc-800'
                        }`}
                    aria-label={copied ? 'Đã sao chép' : 'Sao chép liên kết'}
                >
                    {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

// ============================================
// FLOATING SOCIAL SHARE (SIDEBAR)
// ============================================
export const FloatingSocialShare = ({ url, title, description }) => {
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url || window.location.href);
    const encodedTitle = encodeURIComponent(title || '');

    const shareLinks = [
        {
            name: 'Facebook',
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            bgColor: 'bg-blue-600',
        },
        {
            name: 'Twitter',
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            bgColor: 'bg-sky-500',
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
            bgColor: 'bg-blue-700',
        },
    ];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url || window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-3">
            <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-2 -rotate-90 origin-center whitespace-nowrap absolute -left-8 top-1/2">
                Chia sẻ
            </span>
            {shareLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full ${link.bgColor} text-white
                        flex items-center justify-center shadow-lg
                        hover:scale-110 transition-transform duration-300`}
                    aria-label={`Chia sẻ lên ${link.name}`}
                >
                    <link.icon className="w-4 h-4" />
                </a>
            ))}
            <button
                onClick={copyToClipboard}
                className={`w-10 h-10 rounded-full shadow-lg
                    flex items-center justify-center transition-all duration-300
                    ${copied
                        ? 'bg-green-500 text-white'
                        : 'bg-zinc-800 text-white hover:scale-110'
                    }`}
                aria-label={copied ? 'Đã sao chép' : 'Sao chép liên kết'}
            >
                {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            </button>
        </div>
    );
};

export default SocialShare;
