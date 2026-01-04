/**
 * Theme Toggle Component
 * 
 * Button to switch between light/dark/system theme
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
            'flex h-9 w-9 items-center justify-center rounded-xl',
            'border border-border bg-card text-muted-foreground',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-colors duration-200',
            className
          )}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => {
          console.log('[ThemeToggle] Clicked: light');
          setTheme('light');
        }} className="gap-2">
          <Sun className="h-4 w-4" />
          <span>Sáng</span>
          {theme === 'light' && (
            <span className="ml-auto text-red-500">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          console.log('[ThemeToggle] Clicked: dark');
          setTheme('dark');
        }} className="gap-2">
          <Moon className="h-4 w-4" />
          <span>Tối</span>
          {theme === 'dark' && (
            <span className="ml-auto text-red-500">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          console.log('[ThemeToggle] Clicked: system');
          setTheme('system');
        }} className="gap-2">
          <Monitor className="h-4 w-4" />
          <span>Hệ thống</span>
          {theme === 'system' && (
            <span className="ml-auto text-red-500">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button (no dropdown)
export function ThemeToggleSimple({ className }) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl',
        'border border-border bg-card text-muted-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-colors duration-200',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

export default ThemeToggle;
