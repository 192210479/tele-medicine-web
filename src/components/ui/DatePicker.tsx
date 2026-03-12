import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export function DatePicker() {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const currentDay = 24;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text-primary">October 2023</h3>
        <div className="flex gap-2">
          <button className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map((d) =>
        <span key={d} className="text-xs font-medium text-gray-400">
            {d}
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from(
          {
            length: 31
          },
          (_, i) => i + 1
        ).map((day) =>
        <button
          key={day}
          className={`
              h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${day === currentDay ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-text-primary hover:bg-gray-100'}
              ${day < 20 ? 'text-gray-300 pointer-events-none' : ''}
            `}>

            {day}
          </button>
        )}
      </div>
    </div>);

}