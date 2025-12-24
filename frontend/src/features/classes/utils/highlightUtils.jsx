/**
 * Text highlighting utility for search results
 */

import React from 'react';

/**
 * Highlights matching text in a string
 * @param {string} text - The text to search in
 * @param {string} searchTerm - The term to highlight
 * @param {string} highlightClass - CSS class for highlighted text
 * @returns {React.ReactNode}
 */
export function highlightText(text, searchTerm, highlightClass = 'bg-yellow-200 text-yellow-900 px-0.5 rounded') {
  if (!text || !searchTerm?.trim()) {
    return text;
  }

  try {
    // Escape special regex characters
    const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create case-insensitive regex
    const regex = new RegExp(`(${escapedSearch})`, 'gi');

    // Split text by matches
    const parts = String(text).split(regex);

    if (parts.length === 1) {
      return text; // No matches found
    }

    return parts.map((part, index) => {
      // Check if this part matches the search term
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return (
          <mark key={index} className={highlightClass}>
            {part}
          </mark>
        );
      }
      return part;
    });
  } catch (error) {
    console.warn('highlightText error:', error);
    return text;
  }
}

/**
 * React component for highlighted text
 */
export function HighlightedText({
  text,
  searchTerm,
  className = '',
  highlightClass = 'bg-yellow-200 text-yellow-900 px-0.5 rounded'
}) {
  return (
    <span className={className}>
      {highlightText(text, searchTerm, highlightClass)}
    </span>
  );
}

/**
 * Highlight multiple fields in an object
 * @param {Object} obj - Object with text fields
 * @param {string[]} fields - Fields to highlight
 * @param {string} searchTerm - Search term
 * @returns {Object} Object with highlighted fields
 */
export function highlightFields(obj, fields, searchTerm) {
  if (!obj || !searchTerm?.trim()) return obj;

  const result = { ...obj };

  fields.forEach(field => {
    if (result[field]) {
      result[`${field}_highlighted`] = highlightText(result[field], searchTerm);
    }
  });

  return result;
}
