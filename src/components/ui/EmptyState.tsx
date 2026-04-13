import React from 'react';
import { Button } from './Button';
import { MedicalIllustration } from '../illustrations/MedicalIllustration';
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustrationType?: 'empty' | 'success' | 'doctor' | 'consultation';
}
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  illustrationType = 'empty'
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      <MedicalIllustration
        type={illustrationType}
        className="w-48 h-48 mb-6 opacity-80" />
      

      <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>

      <p className="text-text-secondary mb-8 max-w-xs">{description}</p>

      {actionLabel && onAction &&
      <Button onClick={onAction} className="min-w-[200px]">
          {actionLabel}
        </Button>
      }
    </div>);

}
