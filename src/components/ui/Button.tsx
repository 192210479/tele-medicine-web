import React, { ButtonHTMLAttributes, ReactNode } from 'react';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}
export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
  'h-12 min-h-[48px] px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary:
    'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-dark',
    secondary:
    'bg-secondary text-white shadow-md shadow-secondary/20 hover:bg-secondary-dark',
    outline:
    'border-2 border-primary text-primary bg-transparent hover:bg-primary/5',
    ghost: 'bg-transparent text-text-secondary hover:bg-gray-100',
    danger:
    'bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600'
  };
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}>

      {isLoading ?
      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> :

      <>
          {icon}
          {children}
        </>
      }
    </button>);

}