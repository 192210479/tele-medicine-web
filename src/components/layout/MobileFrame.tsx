import React, { ReactNode } from "react";

interface MobileFrameProps { children: ReactNode; className?: string; }

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, className = "" }) => (
  <div className={`relative mx-auto w-full max-w-sm min-h-screen bg-surface overflow-hidden ${className}`}>
    {children}
  </div>
);

export default MobileFrame;
