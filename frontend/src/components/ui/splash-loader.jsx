import React, { useEffect, useState } from 'react';

// Import logo
import logoImage from '@/assets/logo.png';

/**
 * Brand Splash Loader - Swiss Minimalism Style
 * 
 * Design Philosophy:
 * - Clean, grid-based, high contrast
 * - Brand identity với logo SM và Swiss Red accent
 * - Subtle animations không gây distraction
 * - Typography hierarchy rõ ràng
 */

export function SplashLoader({ 
  message = "Đang chuẩn bị không gian học tập...",
  showProgress = true 
}) {
  const [dots, setDots] = useState('');

  // Animate dots for subtle activity indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-50">
      {/* Subtle grid background - Swiss style */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#18181B 1px, transparent 1px),
            linear-gradient(90deg, #18181B 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} 
      />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-stone-100/50" />
      
      {/* Main content card */}
      <div className="relative flex flex-col items-center">
        {/* Logo container with entrance animation */}
        <div className="relative mb-4 animate-[fadeInUp_0.6s_ease-out]">
          {/* Outer glow ring */}
          <div className="absolute inset-0 -m-8 rounded-3xl bg-gradient-to-br from-red-500/10 to-orange-500/5 blur-3xl animate-pulse" />
          
          {/* Logo image - larger size */}
          <div className="relative">
            <img 
              src={logoImage} 
              alt="Skill Master Logo" 
              className="h-36 sm:h-44 w-auto object-contain"
            />
          </div>
        </div>

        {/* Tagline - closer to logo */}
        <p className="mb-6 text-base text-zinc-500 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
          Chinh phục Anh ngữ & Tin học
        </p>

        {/* Progress indicator */}
        {showProgress && (
          <div className="w-64 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            {/* Progress bar container */}
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-stone-200">
              {/* Animated progress bar */}
              <div 
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                style={{
                  animation: 'progressSlide 1.5s ease-in-out infinite'
                }}
              />
            </div>
            
            {/* Loading message */}
            <p className="mt-4 text-center text-xs text-zinc-400">
              {message}{dots}
            </p>
          </div>
        )}

        {/* Bottom decorative element - Swiss style line */}
        <div className="absolute -bottom-16 left-1/2 h-px w-32 -translate-x-1/2 
                        bg-gradient-to-r from-transparent via-zinc-300 to-transparent
                        animate-[fadeIn_1s_ease-out_0.5s_both]" />
      </div>

      {/* Corner decorations - Swiss grid aesthetic */}
      <div className="absolute left-8 top-8 flex items-center gap-2 animate-[fadeIn_0.8s_ease-out_0.4s_both]">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <div className="h-px w-8 bg-zinc-300" />
      </div>
      
      <div className="absolute bottom-8 right-8 flex items-center gap-2 animate-[fadeIn_0.8s_ease-out_0.5s_both]">
        <div className="h-px w-8 bg-zinc-300" />
        <div className="h-2 w-2 rounded-full bg-zinc-300" />
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes progressSlide {
          0% {
            left: -30%;
            width: 30%;
          }
          50% {
            width: 50%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Minimal variant - for page transitions
 */
export function PageLoader({ message = "Đang tải..." }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Simple logo pulse */}
        <div className="animate-pulse">
          <img 
            src={logoImage} 
            alt="Skill Master" 
            className="h-20 w-auto object-contain opacity-80"
          />
        </div>
        
        {/* Loading text */}
        <p className="text-sm text-zinc-500">{message}</p>
      </div>
    </div>
  );
}

/**
 * Top progress bar - for route transitions
 */
export function TopProgressBar({ isLoading = false }) {
  if (!isLoading) return null;
  
  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] h-1 overflow-hidden bg-stone-200/50">
      <div 
        className="h-full bg-gradient-to-r from-red-500 to-orange-500"
        style={{
          animation: 'progressSlide 1.2s ease-in-out infinite'
        }}
      />
      <style>{`
        @keyframes progressSlide {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(400%); width: 30%; }
        }
      `}</style>
    </div>
  );
}

export default SplashLoader;
