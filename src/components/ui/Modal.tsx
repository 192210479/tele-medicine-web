import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: 'danger' | 'primary';
  children?: React.ReactNode;
}
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'primary',
  children
}: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose} />


      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">

          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-text-primary mb-2 pr-8">
          {title}
        </h3>

        {description &&
          <p className="text-text-secondary text-sm mb-6">{description}</p>
        }

        {children}

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {cancelText}
          </Button>
          {onConfirm &&
            <Button variant={variant} onClick={onConfirm} className="flex-1">
              {confirmText}
            </Button>
          }
        </div>
      </div>
    </div>);

}
