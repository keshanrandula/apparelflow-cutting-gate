'use client';

import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-indigo-600 border-t-transparent ${sizeClasses[size]}`}
      />
      {label && <span className="text-xs font-semibold text-slate-700">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = '📋',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
      <span className="text-3xl mb-2" aria-hidden="true">
        {icon}
      </span>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      {description && <p className="text-xs text-slate-600 max-w-sm mt-1 mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
