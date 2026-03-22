/**
 * Theme Toggle Component
 * 
 * Button to switch between light/dark/system theme
 * with animated Sun/Moon icon morph
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle({ className }) {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-xl',
            'border border-border bg-card text-muted-foreground',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-colors duration-200 overflow-hidden',
            className
          )}
          aria-label="Toggle theme"
        >
          {/* Animated icon container */}
          <div className="relative h-4 w-4">
            <Sun className={cn(
              'absolute inset-0 h-4 w-4 transition-all duration-500',
              isDark
                ? 'rotate-90 scale-0 opacity-0'
                : 'rotate-0 scale-100 opacity-100'
            )} />
            <Moon className={cn(
              'absolute inset-0 h-4 w-4 transition-all duration-500',
              isDark
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0'
            )} />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
          <Sun className="h-4 w-4" />
          <span>Sáng</span>
          {theme === 'light' && (
            <span className="ml-auto text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
          <Moon className="h-4 w-4" />
          <span>Tối</span>
          {theme === 'dark' && (
            <span className="ml-auto text-primary">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
          <Monitor className="h-4 w-4" />
          <span>Hệ thống</span>
          {theme === 'system' && (
            <span className="ml-auto text-primary">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button (no dropdown) — with animated icons
export function ThemeToggleSimple({ className }) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-xl',
        'border border-border bg-card text-muted-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-colors duration-200 overflow-hidden',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative h-4 w-4">
        <Sun className={cn(
          'absolute inset-0 h-4 w-4 transition-all duration-500',
          isDark
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        )} />
        <Moon className={cn(
          'absolute inset-0 h-4 w-4 transition-all duration-500',
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        )} />
      </div>
    </button>
  );
}

export default ThemeToggle;
