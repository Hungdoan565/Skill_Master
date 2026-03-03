import React from 'react';

export const PolicySection = ({ id, heading, content, table }) => {
  // Helper to render string content into paragraphs and lists
  const renderContent = (contentStr) => {
    if (typeof contentStr !== 'string') return contentStr;

    const blocks = contentStr.split('\n\n').filter(Boolean);

    return blocks.map((block, index) => {
      // Check if this block is a bullet list (every line starts with - or •)
      const lines = block.split('\n');
      const isList = lines.every(line => line.trim().startsWith('-') || line.trim().startsWith('•'));

      if (isList) {
        return (
          <ul key={index} className="list-disc list-inside space-y-2 mb-4 text-stone-600 dark:text-stone-300 leading-relaxed">
            {lines.map((line, i) => (
              <li key={i}>{line.replace(/^[-•]\s*/, '').trim()}</li>
            ))}
          </ul>
        );
      }

      // Otherwise, it's a regular paragraph
      return (
        <p key={index} className="mb-4 text-stone-600 dark:text-stone-300 leading-relaxed text-justify">
          {block}
        </p>
      );
    });
  };

  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-2xl font-bold text-zinc-950 dark:text-white mb-6">
        {heading}
      </h2>
      
      <div className="prose prose-stone dark:prose-invert max-w-none">
        {content && renderContent(content)}
      </div>

      {table && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm whitespace-nowrap lg:whitespace-normal">
            <thead className="bg-stone-50 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800">
              <tr>
                {table.headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
              {table.rows.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className="hover:bg-stone-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  {row.map((cell, cellIdx) => (
                    <td 
                      key={cellIdx} 
                      className="px-6 py-4 text-stone-600 dark:text-stone-300"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};