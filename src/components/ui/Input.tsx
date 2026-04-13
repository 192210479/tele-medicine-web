import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = "", ...rest }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
    <div className="relative flex items-center">
      {icon && <span className="absolute left-3 text-text-secondary">{icon}</span>}
      <input
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:opacity-50 ${icon ? "pl-10" : ""} ${error ? "border-red-400" : ""} ${className}`}
        {...rest}
      />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default Input;
