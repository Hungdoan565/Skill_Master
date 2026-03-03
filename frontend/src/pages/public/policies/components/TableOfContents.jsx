import React, { useState, useEffect } from 'react';

export const TableOfContents = ({ sections }) => {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const sectionElements = sections.map((s) => document.getElementById(s.id));

    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.1,
    });

    sectionElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  if (!sections || sections.length === 0) return null;

  return (
    <nav className="lg:sticky lg:top-24 w-full">
      {/* Mobile/Tablet view */}
      <div className="lg:hidden mb-8 overflow-x-auto pb-4">
        <ul className="flex space-x-4 min-w-max px-1">
          {sections.map(({ id, heading }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`block px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    activeId === id
                      ? 'bg-red-600 text-white'
                      : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
                  }`}
              >
                {heading}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block border-l-2 border-stone-200 dark:border-zinc-800 pl-4 py-2">
        <h3 className="font-semibold text-lg text-zinc-950 dark:text-white mb-4">Danh Mục</h3>
        <ul className="space-y-3">
          {sections.map(({ id, heading }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`block text-sm transition-colors hover:text-red-600 dark:hover:text-red-500
                  ${
                    activeId === id
                      ? 'text-red-600 font-semibold dark:text-red-500'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
              >
                {heading}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};