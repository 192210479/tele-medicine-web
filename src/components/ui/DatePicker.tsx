import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  selectedDate?: string;
  onSelect?: (date: string) => void;
  availableDates?: string[];
}

export function DatePicker({ selectedDate, onSelect, availableDates = [] }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  React.useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [selectedDate]);

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text-primary">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((d) => (
          <span key={d} className="text-xs font-medium text-gray-400">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDate }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          
          // Format date to YYYY-MM-DD in local time
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dateStr = String(day).padStart(2, '0');
          const formattedDate = `${year}-${month}-${dateStr}`;

          const isSelected = selectedDate === formattedDate;
          const isAvailable = availableDates.includes(formattedDate);
          const isPast = dateObj < today;

          let btnClass = "h-9 w-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ";
          
          if (isSelected) {
            btnClass += "bg-primary text-white shadow-md shadow-primary/30";
          } else if (isPast) {
            btnClass += "text-gray-300 pointer-events-none";
          } else if (isAvailable) {
            btnClass += "text-primary bg-primary/10 hover:bg-primary hover:text-white";
          } else {
            btnClass += "text-text-primary hover:bg-gray-100";
          }

          return (
            <button
              key={day}
              onClick={() => onSelect?.(formattedDate)}
              disabled={isPast}
              className={btnClass}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
