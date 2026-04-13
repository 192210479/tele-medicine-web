import React from 'react';
interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}
interface RadioGroupProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}
export function RadioGroup({
  options,
  value,
  onChange,
  name
}: RadioGroupProps) {
  return (
    <div className="space-y-3">
      {options.map((option) =>
      <label
        key={option.id}
        className={`
            relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
            ${value === option.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}
          `}>
        
          <input
          type="radio"
          name={name}
          value={option.id}
          checked={value === option.id}
          onChange={() => onChange(option.id)}
          className="sr-only" />
        
          <div
          className={`
            w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center
            ${value === option.id ? 'border-primary' : 'border-gray-300'}
          `}>
          
            {value === option.id &&
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {option.icon}
              <span
              className={`font-medium ${value === option.id ? 'text-primary' : 'text-text-primary'}`}>
              
                {option.label}
              </span>
            </div>
            {option.description &&
          <p className="text-xs text-text-secondary mt-1 ml-0">
                {option.description}
              </p>
          }
          </div>
        </label>
      )}
    </div>);

}
