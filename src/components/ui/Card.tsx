import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-must-surface border border-must-border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
      {...props}>

      {children}
    </div>);

}
export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-4 border-b border-must-border ${className}`}>
      {children}
    </div>);

}
export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}