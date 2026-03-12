import React, { HTMLAttributes, ReactNode } from 'react';
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  noPadding?: boolean;
}
export function Card({
  children,
  className = '',
  noPadding = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-soft border border-gray-100 ${noPadding ? '' : 'p-4'} ${className}`}
      {...props}>

      {children}
    </div>);

}