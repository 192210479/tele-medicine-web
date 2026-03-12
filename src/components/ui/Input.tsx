import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  type,
  className = '',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          className={`
            w-full h-12 rounded-xl border bg-white text-text-primary placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all
            ${icon ? 'pl-11' : 'px-4'}
            ${isPassword ? 'pr-12' : 'pr-4'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
      )}
    </div>
  );
}