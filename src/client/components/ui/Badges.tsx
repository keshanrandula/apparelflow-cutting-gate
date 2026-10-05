'use client';

import React from 'react';
import { OrderStatus, ItemStatus } from '../../types';

export const StatusBadge: React.FC<{ status: OrderStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const config: Record<OrderStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      border: 'border-blue-200',
    },
    PENDING_VERIFICATION: {
      label: 'Pending Verification',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      dot: 'bg-amber-500 animate-pulse',
      border: 'border-amber-200',
    },
    VERIFIED: {
      label: 'Verified & Approved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200',
    },
    REJECTED: {
      label: 'Rejected (Needs Re-cut)',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      dot: 'bg-rose-500',
      border: 'border-rose-200',
    },
    SEWING_STARTED: {
      label: 'Sewing Started',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      dot: 'bg-purple-500',
      border: 'border-purple-200',
    },
  };

  const current = config[status] || config.IN_PROGRESS;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};

export const TrafficBadge: React.FC<{ status: ItemStatus; label?: string }> = ({
  status,
  label,
}) => {
  const config: Record<ItemStatus, { bg: string; text: string; border: string; desc: string }> = {
    GREEN: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      desc: 'Exact Match',
    },
    YELLOW: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
      desc: 'Surplus',
    },
    RED: {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      border: 'border-rose-300',
      desc: 'Shortage',
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className="uppercase tracking-wider">{label || status}</span>
      <span className="font-normal opacity-80">({current.desc})</span>
    </span>
  );
};
