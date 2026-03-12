import React from 'react';
interface MobileFrameProps {
  children: ReactNode;
}
export function MobileFrame({ children }: MobileFrameProps) {
  // MobileFrame is now a passthrough component as the app has been converted to a web layout
  return <>{children}</>;
}