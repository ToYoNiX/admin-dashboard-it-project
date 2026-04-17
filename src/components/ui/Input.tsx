import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  const showRequiredMark = Boolean(props.required);

  return (
    <div className="w-full">
      {label &&
      <label className="block text-sm font-medium text-must-text-primary mb-1">
          {label}
          {showRequiredMark ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      }
      <div className="relative">
        {icon &&
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-must-text-secondary">
            {icon}
          </div>
        }
        <input
          className={`block w-full rounded-lg border border-must-border bg-must-surface text-must-text-primary px-4 py-2 focus:ring-2 focus:ring-must-green focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props} />

      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>);

}
