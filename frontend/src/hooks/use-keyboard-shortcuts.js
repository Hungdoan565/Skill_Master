/**
 * useKeyboardShortcuts Hook
 * 
 * Global keyboard navigation for Admin dashboard
 * Best Practices 2025:
 * - Consistent shortcuts across app
 * - Visual feedback
 * - Customizable
 * - Accessibility support
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Default shortcuts configuration
const DEFAULT_SHORTCUTS = {
  // Navigation
  'g h': { action: 'navigate', path: '/admin/dashboard', description: 'Go to Dashboard' },
  'g c': { action: 'navigate', path: '/admin/courses', description: 'Go to Courses' },
  'g l': { action: 'navigate', path: '/admin/classes', description: 'Go to Classes' },
  'g s': { action: 'navigate', path: '/admin/students', description: 'Go to Students' },
  'g i': { action: 'navigate', path: '/admin/invoices', description: 'Go to Invoices' },
  'g t': { action: 'navigate', path: '/admin/staff', description: 'Go to Staff' },
  'g e': { action: 'navigate', path: '/admin/settings', description: 'Go to Settings' },
  'g r': { action: 'navigate', path: '/admin/reports', description: 'Go to Reports' },
  
  // Actions
  '?': { action: 'custom', description: 'Show keyboard shortcuts' },
  'n': { action: 'custom', description: 'Create new item' },
  '/': { action: 'custom', description: 'Focus search' },
  'Escape': { action: 'custom', description: 'Close modal/cancel' },
};

// Detect if user is typing in an input
function isInputFocused() {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  
  const tagName = activeElement.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isEditable = activeElement.isContentEditable;
  
  return isInput || isEditable;
}

export function useKeyboardShortcuts({
  shortcuts = {},
  enabled = true,
  onShortcut,
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Merge default and custom shortcuts
  const allShortcuts = useMemo(() => ({
    ...DEFAULT_SHORTCUTS,
    ...shortcuts,
  }), [shortcuts]);

  // Key sequence state
  const keySequence = useMemo(() => ({ current: '', timeout: null }), []);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing
    if (isInputFocused()) {
      // Allow Escape to blur
      if (event.key === 'Escape') {
        document.activeElement?.blur();
      }
      return;
    }

    // Clear timeout on new key
    if (keySequence.timeout) {
      clearTimeout(keySequence.timeout);
    }

    // Build key string
    let key = event.key;
    
    // Handle modifier keys
    if (event.metaKey || event.ctrlKey) {
      // Let browser/Command Palette handle these
      return;
    }

    // Update sequence
    keySequence.current = keySequence.current ? `${keySequence.current} ${key}` : key;

    // Check for matching shortcut
    const shortcut = allShortcuts[keySequence.current];

    if (shortcut) {
      event.preventDefault();
      
      // Execute shortcut
      if (shortcut.action === 'navigate') {
        navigate(shortcut.path);
      } else if (shortcut.action === 'custom' && onShortcut) {
        onShortcut(keySequence.current, shortcut);
      }

      // Reset sequence
      keySequence.current = '';
    } else {
      // Check if this could be start of a sequence
      const possibleMatch = Object.keys(allShortcuts).some(s => s.startsWith(keySequence.current));
      
      if (possibleMatch) {
        // Wait for next key
        keySequence.timeout = setTimeout(() => {
          keySequence.current = '';
        }, 1000);
      } else {
        // No match, reset
        keySequence.current = '';
      }
    }
  }, [enabled, allShortcuts, navigate, onShortcut, keySequence]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: allShortcuts,
  };
}

// Shortcuts help dialog data
export function getShortcutGroups() {
  return [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['g', 'h'], description: 'Dashboard' },
        { keys: ['g', 'c'], description: 'Khóa học' },
        { keys: ['g', 'l'], description: 'Lớp học' },
        { keys: ['g', 's'], description: 'Học viên' },
        { keys: ['g', 'i'], description: 'Hóa đơn' },
        { keys: ['g', 't'], description: 'Nhân sự' },
        { keys: ['g', 'e'], description: 'Cài đặt' },
        { keys: ['g', 'r'], description: 'Báo cáo' },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { keys: ['⌘', 'K'], description: 'Command Palette' },
        { keys: ['/'], description: 'Focus search' },
        { keys: ['n'], description: 'Create new' },
        { keys: ['?'], description: 'Show shortcuts' },
        { keys: ['Esc'], description: 'Close/Cancel' },
      ],
    },
  ];
}

export default useKeyboardShortcuts;
