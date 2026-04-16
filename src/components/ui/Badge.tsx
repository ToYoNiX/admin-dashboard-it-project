import React from 'react';
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}
export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) {
  const variants = {
    success:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    default:
    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}>

      {children}
    </span>);

}