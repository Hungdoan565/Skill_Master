import React from 'react';

// ============================================
// ARTICLE CONTENT - STYLED TYPOGRAPHY
// ============================================
// Renders article content with premium typography
// Supports: headings, paragraphs, lists, blockquotes, code, images
// ============================================

export const ArticleContent = ({ content, children }) => {
    return (
        <article className="article-content prose prose-lg lg:prose-xl max-w-none">
            {/* If content is HTML string */}
            {content && (
                <div
                    dangerouslySetInnerHTML={{ __html: content }}
                    className="article-body"
                />
            )}

            {/* If content is React children */}
            {children}

            {/* Scoped Styles for Article Typography */}
            <style>{`
                .article-content {
                    --article-text: #27272a;
                    --article-text-muted: #71717a;
                    --article-border: #e4e4e7;
                    --article-bg-code: #fafafa;
                    --article-accent: #dc2626;
                }

                .article-content h2 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: var(--article-text);
                    margin-top: 3rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid var(--article-border);
                    letter-spacing: -0.025em;
                    scroll-margin-top: 100px;
                }

                .article-content h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--article-text);
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    letter-spacing: -0.02em;
                    scroll-margin-top: 100px;
                }

                .article-content h4 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--article-text);
                    margin-top: 2rem;
                    margin-bottom: 0.75rem;
                    scroll-margin-top: 100px;
                }

                .article-content p {
                    font-size: 1.125rem;
                    line-height: 1.8;
                    color: var(--article-text);
                    margin-bottom: 1.5rem;
                }

                .article-content a {
                    color: var(--article-accent);
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    transition: opacity 0.2s;
                }

                .article-content a:hover {
                    opacity: 0.8;
                }

                .article-content strong {
                    font-weight: 600;
                    color: var(--article-text);
                }

                .article-content ul, 
                .article-content ol {
                    margin: 1.5rem 0;
                    padding-left: 1.5rem;
                }

                .article-content li {
                    font-size: 1.125rem;
                    line-height: 1.8;
                    margin-bottom: 0.75rem;
                    color: var(--article-text);
                }

                .article-content ul li::marker {
                    color: var(--article-accent);
                }

                .article-content ol li::marker {
                    color: var(--article-accent);
                    font-weight: 600;
                }

                .article-content blockquote {
                    border-left: 4px solid var(--article-accent);
                    background: linear-gradient(to right, #fef2f2, transparent);
                    padding: 1.5rem 2rem;
                    margin: 2rem 0;
                    border-radius: 0 1rem 1rem 0;
                    font-style: italic;
                    color: var(--article-text-muted);
                }

                .article-content blockquote p {
                    margin-bottom: 0;
                }

                .article-content code {
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 0.9em;
                    background: var(--article-bg-code);
                    padding: 0.2em 0.5em;
                    border-radius: 0.375rem;
                    border: 1px solid var(--article-border);
                }

                .article-content pre {
                    background: #18181b;
                    color: #fafafa;
                    padding: 1.5rem;
                    border-radius: 1rem;
                    overflow-x: auto;
                    margin: 2rem 0;
                    font-size: 0.9rem;
                    line-height: 1.7;
                }

                .article-content pre code {
                    background: transparent;
                    padding: 0;
                    border: none;
                    color: inherit;
                }

                .article-content img {
                    width: 100%;
                    border-radius: 1rem;
                    margin: 2rem 0;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
                }

                .article-content figure {
                    margin: 2rem 0;
                }

                .article-content figcaption {
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--article-text-muted);
                    margin-top: 0.75rem;
                }

                .article-content hr {
                    border: none;
                    height: 1px;
                    background: var(--article-border);
                    margin: 3rem 0;
                }

                .article-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 2rem 0;
                    font-size: 0.95rem;
                }

                .article-content th,
                .article-content td {
                    padding: 0.75rem 1rem;
                    border: 1px solid var(--article-border);
                    text-align: left;
                }

                .article-content th {
                    background: var(--article-bg-code);
                    font-weight: 600;
                }

                .article-content tr:nth-child(even) {
                    background: var(--article-bg-code);
                }

                /* ============================================ */
                /* PRINT STYLES - CHỈ IN NỘI DUNG BÀI VIẾT */
                /* ============================================ */
                @media print {
                    /* Ẩn tất cả ngoại trừ nội dung chính */
                    body * {
                        visibility: hidden;
                    }

                    /* Hiển thị article và các element bên trong */
                    .print-article,
                    .print-article * {
                        visibility: visible;
                    }

                    /* Reset position để print ở đầu trang */
                    .print-article {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20mm;
                    }

                    /* Typography cho print */
                    .article-content {
                        font-size: 12pt;
                        line-height: 1.6;
                        color: #000;
                    }

                    .article-content h2 {
                        font-size: 18pt;
                        page-break-after: avoid;
                        margin-top: 20pt;
                    }

                    .article-content h3 {
                        font-size: 14pt;
                        page-break-after: avoid;
                    }

                    .article-content p,
                    .article-content li {
                        font-size: 11pt;
                        line-height: 1.6;
                    }

                    /* Tránh page break giữa các phần tử */
                    .article-content h2,
                    .article-content h3,
                    .article-content h4,
                    .article-content blockquote,
                    .article-content pre,
                    .article-content figure {
                        page-break-inside: avoid;
                    }

                    /* Links - hiển thị URL */
                    .article-content a[href]:after {
                        content: " (" attr(href) ")";
                        font-size: 9pt;
                        color: #666;
                    }

                    /* Code blocks - border thay vì background */
                    .article-content pre {
                        background: white;
                        border: 1pt solid #ccc;
                        padding: 10pt;
                        font-size: 9pt;
                    }

                    .article-content code {
                        background: #f5f5f5;
                        border: 1pt solid #ddd;
                        padding: 2pt 4pt;
                    }

                    /* Images - fit to page */
                    .article-content img {
                        max-width: 100% !important;
                        page-break-inside: avoid;
                    }

                    /* Blockquotes */
                    .article-content blockquote {
                        border-left: 3pt solid #333;
                        background: #f9f9f9;
                        padding: 10pt 15pt;
                        font-style: italic;
                    }
                }
            `}</style>
        </article>
    );
};

export default ArticleContent;
