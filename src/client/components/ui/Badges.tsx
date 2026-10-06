'use client';

import React from 'react';
import { OrderStatus, ItemStatus } from '@/client/types';

export const StatusBadge: React.FC<{ status: OrderStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-bold';

  const config: Record<
    OrderStatus,
    { label: string; icon: string; bg: string; text: string; border: string }
  > = {
    IN_PROGRESS: {
      label: 'In Progress',
      icon: '⏳',
      bg: 'bg-orange-50',
      text: 'text-orange-950',
      border: 'border-orange-300',
    },
    PENDING_VERIFICATION: {
      label: 'Pending Verification',
      icon: '🔍',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
    },
    VERIFIED: {
      label: 'Verified & Approved',
      icon: '✓',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
    },
    REJECTED: {
      label: 'Rejected (Needs Re-cut)',
      icon: '✕',
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      border: 'border-rose-300',
    },
    SEWING_STARTED: {
      label: 'Sewing Started',
      icon: '🧵',
      bg: 'bg-orange-100',
      text: 'text-orange-950',
      border: 'border-orange-400',
    },
  };

  const current = config[status] || config.IN_PROGRESS;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
      role="status"
    >
      <span aria-hidden="true">{current.icon}</span>
      <span>{current.label}</span>
    </span>
  );
};

export const TrafficBadge: React.FC<{
  status: ItemStatus;
  diff?: number;
  label?: string;
}> = ({ status, diff, label }) => {
  const config: Record<
    ItemStatus,
    { bg: string; text: string; border: string; icon: string; defaultLabel: string }
  > = {
    GREEN: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-950',
      border: 'border-emerald-400',
      icon: '✓',
      defaultLabel: 'GREEN Match',
    },
    YELLOW: {
      bg: 'bg-amber-100',
      text: 'text-amber-950',
      border: 'border-amber-400',
      icon: '▲',
      defaultLabel: diff !== undefined && diff > 0 ? `YELLOW Excess +${diff}` : 'YELLOW Excess',
    },
    RED: {
      bg: 'bg-rose-100',
      text: 'text-rose-950',
      border: 'border-rose-400',
      icon: '✕',
      defaultLabel: diff !== undefined ? `RED Shortage -${Math.abs(diff)}` : 'RED Shortage',
    },
  };

  const current = config[status] || config.GREEN;
  const displayText = label || current.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black border ${current.bg} ${current.text} ${current.border}`}
      role="status"
    >
      <span aria-hidden="true" className="font-extrabold">{current.icon}</span>
      <span className="tracking-wide uppercase font-bold">{displayText}</span>
    </span>
  );
};

export const Badge = StatusBadge;
