import * as React from 'react';
interface TimeSlotPickerProps {
  selectedTime: string;
  onSelect: (time: string) => void;
}
export function TimeSlotPicker({
  selectedTime,
  onSelect
}: TimeSlotPickerProps) {
  const slots = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM'];

  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((time) =>
      <button
        key={time}
        onClick={() => onSelect(time)}
        className={`
            py-2 px-1 rounded-lg text-sm font-medium border transition-all
            ${selectedTime === time ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-200 bg-white text-text-primary hover:border-primary/50'}
          `}>
        
          {time}
        </button>
      )}
    </div>);

}
