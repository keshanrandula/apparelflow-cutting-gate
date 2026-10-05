'use client';

import React, { forwardRef, useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const describedBy = error
      ? errorId
      : helperText
      ? helperId
      : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
          >
            {label}
            {props.required && <span className="text-rose-700 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full rounded-lg px-3.5 py-2.5 text-sm text-[#111827] bg-white placeholder:text-[#6b7280] border ${
            error ? 'border-[#b91c1c] focus:border-[#b91c1c]' : 'border-[#6b7280] focus:border-[#2563eb]'
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

Textarea.displayName = 'Textarea';
