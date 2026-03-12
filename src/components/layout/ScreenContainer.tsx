import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface ScreenContainerProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
  noScroll?: boolean;
  actions?: ReactNode;
}
export function ScreenContainer({
  children,
  title,
  showBack = false,
  onBack,
  className = '',
  noScroll = false,
  actions
}: ScreenContainerProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-surface ${className}`}>
      {/* Header */}
      {(title || showBack || actions) && (
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-white shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-4">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            {title &&
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                {title}
              </h1>
          }
          </div>
          {actions && <div>{actions}</div>}
        </header>
      )}

      {/* Content */}
      <main
        className={`flex-1 ${noScroll ? 'overflow-hidden' : 'overflow-y-auto'} ${title || showBack ? '' : 'pt-4 sm:pt-6'}`}>

        <div className="max-w-4xl mx-auto w-full h-full relative">
          {children}
        </div>
      </main>
    </div>);

}