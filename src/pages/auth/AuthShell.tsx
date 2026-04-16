import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';

interface AuthShellProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ title, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-must-bg flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border border-must-border">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <img src="/assists/must_logo.png" alt="MUST Logo" className="w-24 h-24 object-contain" />
            <h1 className="mt-4 text-xl font-bold text-must-text-primary">{title}</h1>
            <p className="mt-1 text-xs text-must-text-secondary">
              College of Information Technology
            </p>
            <p className="text-xs text-must-text-secondary">
              International Student Affairs Dashboard
            </p>
          </div>

          {children}

          {footer ? <div className="mt-6 text-sm text-center">{footer}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
