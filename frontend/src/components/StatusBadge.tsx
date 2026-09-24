import React from 'react';
import { ActionItemStatus } from '../types';
import { Sparkles, ArrowRightLeft, CheckCircle2, AlertTriangle, HelpCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: ActionItemStatus | 'UNRESOLVED' | 'RESOLVED' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const config: Record<string, { label: string; bg: string; icon: any; dot: string }> = {
    NEW: {
      label: 'NEW',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Sparkles,
      dot: 'bg-emerald-400'
    },
    CARRIED_OVER: {
      label: 'CARRIED OVER',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: ArrowRightLeft,
      dot: 'bg-amber-400'
    },
    COMPLETED: {
      label: 'COMPLETED',
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: CheckCircle2,
      dot: 'bg-indigo-400'
    },
    OVERDUE: {
      label: 'OVERDUE',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: AlertTriangle,
      dot: 'bg-rose-400'
    },
    AMBIGUOUS: {
      label: 'AMBIGUOUS',
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      icon: HelpCircle,
      dot: 'bg-purple-400'
    },
    UNRESOLVED: {
      label: 'UNRESOLVED',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: AlertTriangle,
      dot: 'bg-amber-400'
    },
    RESOLVED: {
      label: 'RESOLVED',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      dot: 'bg-emerald-400'
    }
  };

  const current = config[status] || {
    label: status,
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: Clock,
    dot: 'bg-slate-400'
  };

  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full backdrop-blur-sm transition-all select-none ${current.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span className="tracking-wide font-semibold">{current.label}</span>
    </span>
  );
};
