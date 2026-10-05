'use client';

import React, { forwardRef, useId } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, children, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const describedBy = error
      ? errorId
      : helperText
      ? helperId
      : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5"
          >
            {label}
            {props.required && <span className="text-rose-700 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full rounded-lg px-3.5 py-2 text-sm text-[#111827] bg-white border ${
            error ? 'border-[#b91c1c] focus:border-[#b91c1c]' : 'border-[#6b7280] focus:border-[#2563eb]'
          } ${className}`}
          style={{ color: '#111827', backgroundColor: '#ffffff' }}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled} className="text-[#111827] bg-white">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
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

Select.displayName = 'Select';
