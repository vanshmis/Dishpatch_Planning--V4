import React from 'react';
import { PIStatus, DispatchStatus, PriorityLevel } from '../../types';

interface StatusBadgeProps {
  status: PIStatus | DispatchStatus | PriorityLevel | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-500';

  switch (status) {
    case 'PENDING':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200/80';
      dotClass = 'bg-amber-500';
      break;
    case 'APPROVED':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      dotClass = 'bg-emerald-500';
      break;
    case 'PLANNED':
      bgClass = 'bg-blue-50 text-blue-800 border-blue-200/80';
      dotClass = 'bg-blue-500';
      break;
    case 'READY_FOR_LOADING':
      bgClass = 'bg-indigo-50 text-indigo-800 border-indigo-200/80';
      dotClass = 'bg-indigo-500';
      break;
    case 'LOADING':
      bgClass = 'bg-purple-50 text-purple-800 border-purple-200/80 animate-pulse';
      dotClass = 'bg-purple-600';
      break;
    case 'GATE_PASS_ISSUED':
      bgClass = 'bg-cyan-50 text-cyan-800 border-cyan-200/80';
      dotClass = 'bg-cyan-500';
      break;
    case 'IN_TRANSIT':
    case 'DISPATCHED':
      bgClass = 'bg-sky-50 text-sky-800 border-sky-200/80';
      dotClass = 'bg-sky-600';
      break;
    case 'DELIVERED':
      bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      dotClass = 'bg-emerald-600';
      break;
    case 'CANCELLED':
    case 'HOLD':
      bgClass = 'bg-rose-50 text-rose-800 border-rose-200/80';
      dotClass = 'bg-rose-500';
      break;
    case 'DRAFT':
      bgClass = 'bg-slate-200 text-slate-800 border-slate-300 font-bold';
      dotClass = 'bg-slate-600';
      break;
    case 'URGENT':
      bgClass = 'bg-red-50 text-red-700 border-red-200 font-semibold';
      dotClass = 'bg-red-600';
      break;
    case 'HIGH':
      bgClass = 'bg-orange-50 text-orange-700 border-orange-200';
      dotClass = 'bg-orange-500';
      break;
    case 'NORMAL':
      bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
      dotClass = 'bg-slate-400';
      break;
    case 'AVAILABLE':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotClass = 'bg-emerald-500';
      break;
    case 'ASSIGNED':
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      dotClass = 'bg-blue-500';
      break;
    case 'MAINTENANCE':
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
      dotClass = 'bg-amber-500';
      break;
    default:
      bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
      dotClass = 'bg-slate-400';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-medium',
  };

  const formattedText = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-tight uppercase ${bgClass} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{formattedText}</span>
    </span>
  );
};
