import React from 'react';
import { ActionItemStatus } from '../types';
import { Sparkles, ArrowRightLeft, CheckCircle2, AlertTriangle, HelpCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: ActionItemStatus | 'RESOLVED' | 'UNRESOLVED';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  const configs: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    NEW: {
      label: 'NEW',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
    },
    CARRIED_OVER: {
      label: 'CARRIED-OVER',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
    },
    COMPLETED: {
      label: 'COMPLETED',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
    },
    OVERDUE: {
      label: 'OVERDUE',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
    },
    AMBIGUOUS: {
      label: 'AMBIGUOUS',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
    },
    UNRESOLVED: {
      label: 'UNRESOLVED',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      icon: <Clock className="w-3.5 h-3.5 text-amber-300" />
    },
    RESOLVED: {
      label: 'RESOLVED',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
    }
  };

  const config = configs[status] || configs['NEW'];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
