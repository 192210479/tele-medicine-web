import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiDelete } from '../services/api';
import socket from '../services/socketService';

export function DoctorAvailabilityScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [existingSlots, setExistingSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchSlots();
    }
  }, [userId, selectedDate]);

  // 1. REFRESH SLOT LIST using GET /api/doctor/availability/{doctorId}
  const fetchSlots = async () => {
    try {
      const data = await apiGet(`/api/doctor/availability/${userId}`);
      if (Array.isArray(data)) {
        // Filter slots for the selected date
        const filtered = data.filter((slot: any) => slot.date === selectedDate);
        setExistingSlots(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  // 2. PREVENT DUPLICATE SLOT CREATION & EMIT SOCKET EVENT
  const handleAddSlot = async () => {
    if (!userId) return;

    // 2. Check for duplicate local slot
    const isDuplicate = existingSlots.some(
      slot => slot.date === selectedDate && slot.time_slot === selectedTime
    );

    if (isDuplicate) {
      alert("Slot already exists for this time.");
      return;
    }

    setIsLoading(true);
    try {
      await apiPost('/api/doctor/availability', {
        user_id: userId,
        role: 'doctor',
        date: selectedDate,
        time_slot: selectedTime
      });
      
      setShowSuccess(true);
      
      // 1. Refresh slot list without page reload
      fetchSlots();

      // 1. Emit availability_updated socket event
      if (socket) {
        socket.emit("availability_updated", { doctor_id: userId });
      }
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to add slot:', error);
      alert('Failed to add slot');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. FIX DELETE AVAILABILITY FUNCTION
  const handleDeleteSlot = async (slotId: number) => {
    if (!userId) return;
    try {
        // DELETE /api/doctor/availability/{slot_id}?user_id=doctorId&role=doctor
        await apiDelete(`/api/doctor/availability/${slotId}?user_id=${userId}&role=doctor`);
        
        // Immediately remove the slot from the UI
        setExistingSlots(prev => prev.filter(s => (s.id || s.availability_id) !== slotId));

        // Then refresh the slot list
        fetchSlots();

        // Inform other users as well
        if (socket) {
          socket.emit("availability_updated", { doctor_id: userId });
        }
    } catch (error) {
        console.error('Failed to delete slot:', error);
        alert('Failed to delete slot');
    }
  };

  return (
    <ScreenContainer 
      title="Set Availability" 
      showBack 
      onBack={() => navigate('/doctor-dashboard')}
    >
      <div className="px-6 py-8 space-y-8 pb-20">
        {/* 2. ALLOW DOCTOR CUSTOM TIME SLOT ENTRY (Date & Time Picker) */}
        <section>
          <label className="block text-sm font-black text-text-primary mb-3 flex items-center gap-2 uppercase tracking-widest">
            <CalendarIcon size={18} className="text-primary" />
            1. Select Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-primary outline-none transition-all font-bold text-lg bg-surface"
          />
        </section>

        <section>
          <label className="block text-sm font-black text-text-primary mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Clock size={18} className="text-primary" />
            2. Enter Time (Custom)
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-primary outline-none transition-all font-bold text-lg bg-surface"
          />
        </section>

        {/* Action Button */}
        <Button 
          fullWidth 
          onClick={handleAddSlot} 
          isLoading={isLoading}
          disabled={isLoading} // 2. Disable while processing
          icon={<Plus size={20} />}
          className="shadow-xl shadow-primary/20 h-16 rounded-2xl text-lg font-black"
        >
          Add Availability Slot
        </Button>

        {/* Success Message */}
        {showSuccess && (
          <div className="flex items-center gap-3 p-5 bg-green-50 text-green-700 rounded-2xl animate-bounce border-2 border-green-100 shadow-sm">
            <CheckCircle2 size={24} />
            <span className="font-bold">Slot added successfully!</span>
          </div>
        )}

        {/* Existing Slots List */}
        <section className="pt-8 border-t-2 border-gray-50">
          <h3 className="font-black text-text-primary mb-6 flex items-center justify-between">
            <span>Slots on {selectedDate}</span>
            <span className="text-xs px-3 py-1 bg-gray-100 rounded-full font-bold text-gray-500">
               {existingSlots.length} Total
            </span>
          </h3>
          <div className="space-y-4">
            {existingSlots.length > 0 ? (
              existingSlots.map((slot) => {
                const slotId = slot.id || slot.availability_id;
                return (
                    <div 
                      key={slotId} 
                      className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-gray-50 shadow-soft hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary border border-blue-100 group-hover:scale-110 transition-transform">
                          <Clock size={24} />
                        </div>
                        <div>
                          <span className="font-black text-text-primary text-lg">{slot.time_slot}</span>
                          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">{slot.is_booked ? 'Status: Booked' : 'Status: Free'}</p>
                        </div>
                      </div>
                      
                      {slot.is_booked ? (
                        <span className="text-[10px] font-black px-4 py-2 bg-green-50 text-green-700 rounded-full uppercase tracking-tighter border border-green-100">Confirmed</span>
                      ) : (
                        <button 
                            onClick={() => handleDeleteSlot(slotId)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
                            title="Delete Slot"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <CalendarIcon size={32} />
                </div>
                <p className="text-text-secondary font-bold">No slots added for this date</p>
                <p className="text-xs text-gray-400 mt-1">Select a time above to get started</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </ScreenContainer>
  );
}
