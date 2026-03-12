import React from 'react';
import { Card } from './Card';
interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}
export function StatsCard({
  label,
  value,
  icon,
  trend,
  trendUp
}: StatsCardProps) {
  return (
    <Card className="flex items-center p-4 gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
          {label}
        </p>
        <h4 className="text-xl font-bold text-text-primary">{value}</h4>
        {trend &&
        <p
          className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-red-500'}`}>

            {trend}
          </p>
        }
      </div>
    </Card>);

}