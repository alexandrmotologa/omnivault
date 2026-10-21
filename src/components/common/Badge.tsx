import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'muted';
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const baseClasses =
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors select-none';

  const variantClasses = {
    default: 'bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    accent: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    muted: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400',
  };

  const clickable = onClick ? 'cursor-pointer hover:opacity-80 active:scale-95' : '';

  return (
    <span
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${clickable} ${className}`}
    >
      {children}
    </span>
  );
};
