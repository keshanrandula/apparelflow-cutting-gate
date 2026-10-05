'use client';

import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = error
      ? errorId
      : helperText
      ? helperId
      : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
          >
            {label}
            {props.required && <span className="text-rose-700 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full rounded-lg px-3.5 py-2 text-sm text-[#111827] bg-white placeholder:text-[#6b7280] border ${
            error ? 'border-[#b91c1c] focus:border-[#b91c1c] focus:ring-[#b91c1c]/20' : 'border-[#6b7280] focus:border-[#2563eb]'
          } ${className}`}
          style={{ color: '#111827', backgroundColor: '#ffffff' }}
          {...props}
        />
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-slate-600">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-[#b91c1c] flex items-center gap-1">
            <span>⚠</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
