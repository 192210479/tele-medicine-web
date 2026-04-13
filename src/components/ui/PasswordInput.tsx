import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps {
  label?:        string;
  placeholder?:  string;
  value:         string;
  onChange:      (val: string) => void;
  className?:    string;
  disabled?:     boolean;
  error?:        string;
}

export const PasswordInput = ({
  label, placeholder = "••••••••",
  value, onChange, className = "", disabled, error
}: PasswordInputProps) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
          <Lock size={18} />
        </span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-12 pl-11 pr-12 rounded-xl border ${error ? 'border-red-500 bg-red-50/30' : 'border-gray-200 bg-white'} 
                     focus:outline-none focus:ring-4 focus:ring-primary/10 
                     focus:border-primary text-sm font-medium transition-all disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2
                     text-gray-400 hover:text-primary transition-colors focus:outline-none"
          tabIndex={-1}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-red-500 px-1">{error}</p>}
    </div>
  );
};
