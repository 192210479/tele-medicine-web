import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export interface ScreenContainerProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBackClick?: () => void;
  actions?: ReactNode;
  noScroll?: boolean;
  scrollable?: boolean;
  className?: string;
}

export const ScreenContainer = ({
  children,
  title,
  showBack = false,
  onBackClick,
  actions,
  noScroll = false,
  scrollable = true,
  className = "",
}: ScreenContainerProps) => {
  const navigate = useNavigate();
  const handleBack = () => (onBackClick ? onBackClick() : navigate(-1));
  const showHeader = !!(title || showBack || actions);
  const scrollClass = noScroll || !scrollable ? "overflow-hidden" : "overflow-y-auto";

  return (
    <div className={`flex flex-col w-full h-full ${scrollClass} ${className}`}>
      {showHeader && (
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-20">
          <div className="w-10 flex items-center">
            {showBack && (
              <button
                onClick={handleBack}
                className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={22} className="text-gray-700" />
              </button>
            )}
          </div>
          {title ? (
            <h1 className="flex-1 text-center text-base font-semibold text-gray-900 truncate px-2">
              {title}
            </h1>
          ) : (
            <div className="flex-1" />
          )}
          <div className="w-10 flex items-center justify-end">
            {actions ?? null}
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
};

export default ScreenContainer;

