import React, { useEffect } from 'react';
import PublicHeader from '@/components/layout/public-header';
import { Footer } from '@/pages/landing/components/footer';
import { TableOfContents } from './TableOfContents';
import { SEOHead } from '@/components/common';

export const PolicyLayout = ({ title, lastUpdated, sections, children }) => {
  useEffect(() => {
    document.title = `${title} - Skill Master Academy`;
  }, [title]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <SEOHead 
        title={`${title} - Skill Master Academy`} 
        description={`Đọc và tìm hiểu về ${title.toLowerCase()} của Skill Master. Cập nhật mới nhất.`} 
      />
      <PublicHeader />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12 border-b border-stone-200 dark:border-zinc-800 pb-8">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white mb-4">
              {title}
            </h1>
            {lastUpdated && (
              <p className="text-stone-500 dark:text-stone-400 font-medium">
                Cập nhật lần cuối: {lastUpdated}
              </p>
            )}
          </div>

          {/* Grid Layout */}
          <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-16">
            <aside>
              <TableOfContents sections={sections} />
            </aside>
            <div className="space-y-16">
              {children}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};