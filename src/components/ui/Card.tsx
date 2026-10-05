'use client';

import React from 'react';
export { Modal } from './Modal';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
}) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-xs ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            {title && <h3 className="text-base font-extrabold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-600 mt-0.5 font-medium">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
