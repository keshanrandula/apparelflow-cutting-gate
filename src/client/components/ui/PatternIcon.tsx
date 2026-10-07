'use client';

import React from 'react';

interface PatternIconProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PatternIcon: React.FC<PatternIconProps> = ({
  name,
  imageUrl,
  className = '',
  size = 'md',
}) => {
  const lower = (name || '').toLowerCase();

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  // Helper to render distinct vector pattern shapes
  const renderSvgShape = () => {
    if (lower.includes('front') || lower.includes('chest')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#FEF3C7" className="dark:fill-amber-950/40" />
          <path
            d="M26 22 L36 18 Q50 28 64 18 L74 22 L80 44 L72 48 L74 80 L26 80 L28 48 L20 44 Z"
            fill="#FDE68A"
            stroke="#B45309"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="50" y1="24" x2="50" y2="80" stroke="#92400E" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="50" cy="36" r="1.5" fill="#78350F" />
          <circle cx="50" cy="48" r="1.5" fill="#78350F" />
          <circle cx="50" cy="60" r="1.5" fill="#78350F" />
          <circle cx="50" cy="72" r="1.5" fill="#78350F" />
          <path d="M34 40 L34 58 M32 43 L34 40 L36 43" stroke="#B45309" strokeWidth="1.2" />
        </svg>
      );
    }

    if (lower.includes('back') || lower.includes('support')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#DBEAFE" className="dark:fill-blue-950/40" />
          <path
            d="M26 22 L38 18 Q50 22 62 18 L74 22 L80 44 L72 48 L74 80 L26 80 L28 48 L20 44 Z"
            fill="#BFDBFE"
            stroke="#1D4ED8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="30" y1="36" x2="70" y2="36" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M50 42 L50 62 M48 45 L50 42 L52 45" stroke="#1E40AF" strokeWidth="1.2" />
        </svg>
      );
    }

    if (lower.includes('sleeve')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#E0E7FF" className="dark:fill-indigo-950/40" />
          <path
            d="M22 34 Q50 14 78 34 L68 80 L32 80 Z"
            fill="#C7D2FE"
            stroke="#4338CA"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="32" y1="76" x2="68" y2="76" stroke="#3730A3" strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M50 38 L50 66 M48 41 L50 38 L52 41" stroke="#3730A3" strokeWidth="1.2" />
        </svg>
      );
    }

    if (lower.includes('collar') || lower.includes('stand')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#D1FAE5" className="dark:fill-emerald-950/40" />
          <path
            d="M18 52 Q50 32 82 52 L84 66 Q50 48 16 66 Z"
            fill="#A7F3D0"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M22 36 Q50 20 78 36 L82 48 Q50 34 18 48 Z"
            fill="#6EE7B7"
            stroke="#065F46"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (lower.includes('cuff')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#FCE7F3" className="dark:fill-pink-950/40" />
          <rect
            x="20"
            y="36"
            width="60"
            height="28"
            rx="6"
            fill="#FBCFE8"
            stroke="#BE185D"
            strokeWidth="2.5"
          />
          <line x1="24" y1="40" x2="76" y2="40" stroke="#9D174D" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="24" y1="60" x2="76" y2="60" stroke="#9D174D" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="34" cy="50" r="2.5" fill="#831843" />
          <ellipse cx="66" cy="50" rx="3" ry="1.2" fill="#831843" />
        </svg>
      );
    }

    if (lower.includes('neck') || lower.includes('binding')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#EDE9FE" className="dark:fill-purple-950/40" />
          <path
            d="M20 62 Q50 24 80 62 L74 68 Q50 36 26 68 Z"
            fill="#DDD6FE"
            stroke="#6D28D9"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M50 44 L50 56" stroke="#5B21B6" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>
      );
    }

    if (lower.includes('elastic') || lower.includes('hem') || lower.includes('casing')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#CCFBF1" className="dark:fill-teal-950/40" />
          <rect
            x="18"
            y="38"
            width="64"
            height="24"
            rx="5"
            fill="#99F6E4"
            stroke="#0F766E"
            strokeWidth="2.5"
          />
          {/* Elastic Rib Lines */}
          <line x1="26" y1="38" x2="26" y2="62" stroke="#115E59" strokeWidth="1.2" />
          <line x1="34" y1="38" x2="34" y2="62" stroke="#115E59" strokeWidth="1.2" />
          <line x1="42" y1="38" x2="42" y2="62" stroke="#115E59" strokeWidth="1.2" />
          <line x1="50" y1="38" x2="50" y2="62" stroke="#115E59" strokeWidth="1.2" />
          <line x1="58" y1="38" x2="58" y2="62" stroke="#115E59" strokeWidth="1.2" />
          <line x1="66" y1="38" x2="66" y2="62" stroke="#115E59" strokeWidth="1.2" />
          <line x1="74" y1="38" x2="74" y2="62" stroke="#115E59" strokeWidth="1.2" />
        </svg>
      );
    }

    if (lower.includes('strap') || lower.includes('accent')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#FFEDD5" className="dark:fill-orange-950/40" />
          <rect x="32" y="20" width="12" height="60" rx="3" fill="#FED7AA" stroke="#C2410C" strokeWidth="2" />
          <rect x="56" y="20" width="12" height="60" rx="3" fill="#FED7AA" stroke="#C2410C" strokeWidth="2" />
          <line x1="38" y1="24" x2="38" y2="76" stroke="#9A3412" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="62" y1="24" x2="62" y2="76" stroke="#9A3412" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    }

    if (lower.includes('pocket')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" rx="14" fill="#F3E8FF" className="dark:fill-purple-950/40" />
          <path
            d="M26 30 L74 30 L74 60 L50 78 L26 60 Z"
            fill="#E9D5FF"
            stroke="#7E22CE"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="28" y1="38" x2="72" y2="38" stroke="#6B21A8" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>
      );
    }

    // Default Pattern Piece
    return (
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
        <rect width="100" height="100" rx="14" fill="#F1F5F9" className="dark:fill-slate-800" />
        <path
          d="M24 24 L76 24 L76 76 L24 76 Z"
          fill="#E2E8F0"
          stroke="#475569"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="44" cy="46" r="4" stroke="#0F172A" strokeWidth="1.8" />
        <circle cx="44" cy="54" r="4" stroke="#0F172A" strokeWidth="1.8" />
        <line x1="47" y1="48" x2="60" y2="57" stroke="#0F172A" strokeWidth="2" />
        <line x1="47" y1="52" x2="60" y2="43" stroke="#0F172A" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-700/80 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xs ${sizeClasses} ${className}`}
      title={name}
    >
      {imageUrl && !imageUrl.includes('default.svg') ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to inline SVG if image file missing
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        renderSvgShape()
      )}
    </div>
  );
};
