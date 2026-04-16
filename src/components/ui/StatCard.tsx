import React from 'react';
import { Card } from './Card';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  colorClass?: string;
}
export function StatCard({
  icon,
  value,
  label,
  trend,
  trendDirection,
  colorClass = 'text-must-navy dark:text-white bg-blue-50 dark:bg-blue-900/20'
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClass}`}>{icon}</div>
          {trend &&
          <div
            className={`flex items-center text-sm font-medium ${trendDirection === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>

              {trendDirection === 'up' ?
            <TrendingUpIcon className="w-4 h-4 mr-1" /> :

            <TrendingDownIcon className="w-4 h-4 mr-1" />
            }
              {trend}
            </div>
          }
        </div>
        <div>
          <h3 className="text-3xl font-bold text-must-text-primary mb-1">
            {value}
          </h3>
          <p className="text-sm text-must-text-secondary font-medium">
            {label}
          </p>
        </div>
      </div>
    </Card>);

}