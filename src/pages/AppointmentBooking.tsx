import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Globe, DollarSign, Award, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Lock } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { DoctorCard } from '../components/ui/DoctorCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { apiGet, apiPost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socketService';

export function AppointmentBooking() {
  const { role, userId } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calendar & Slot State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('/api/doctors');
      setDoctors(data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = useCallback(async () => {
    if (!selectedDoctor) return;
    try {
      const data = await apiGet(`/api/doctor/availability/${selectedDoctor.id}`);
      if (Array.isArray(data)) {
        setAvailableSlots(data);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setAvailableSlots([]);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (step === 3 && selectedDoctor) {
      fetchAvailability();
    }
  }, [step, selectedDoctor, fetchAvailability]);

  // Socket Listeners for Auto Update
  useEffect(() => {
    if (socket && selectedDoctor && step === 3) {
      const handleRefresh = (data: any) => {
        if (data.doctor_id === selectedDoctor.id) {
          fetchAvailability();
        }
      };

      socket.on("availability_updated", handleRefresh);
      socket.on("slot_booked", handleRefresh);

      return () => {
        socket.off("availability_updated", handleRefresh);
        socket.off("slot_booked", handleRefresh);
      };
    }
  }, [selectedDoctor, step, fetchAvailability]);

  const handleDoctorSelect = (doc: any) => {
    setSelectedDoctor(doc);
    setStep(2);
  };

  const handleStartBooking = () => {
    setStep(3);
  };

  // 4, 5, 6, 7. FIX BOOKING LOGIC, FORMAT, STATUS, AND EMIT
  const handleConfirmBooking = async () => {
    // 4. Validate inputs
    if (!selectedSlotId) {
        alert("Please select a time slot before confirming.");
        return;
    }
    
    if (!selectedDoctor || !userId) {
        console.error("Missing doctor or patient ID");
        return;
    }
    
    setIsLoading(true);
    try {
      // 5. CORRECT BOOKING REQUEST FORMAT
      // Backend only expects availability_id, user_id, role.
      const response = await apiPost('/api/appointment/book', {
        user_id: userId,
        role: "patient",
        availability_id: selectedSlotId
      });
      
      // 6. UPDATE SLOT STATUS AFTER BOOKING
      setAvailableSlots(prev => 
        prev.map(s => (s.id || s.availability_id) === selectedSlotId ? { ...s, is_booked: true } : s)
      );

      // 7. REFRESH DOCTOR DASHBOARD (emit specific event)
      if (socket) {
        socket.emit("new_appointment_created", {
          doctor_id: selectedDoctor.id,
          patient_id: userId,
          availability_id: selectedSlotId
        });
        
        // Also emit old event for backward compatibility if needed
        socket.emit("slot_booked", {
          doctor_id: selectedDoctor.id,
          slot_id: selectedSlotId
        });
      }

      alert('Appointment booked successfully!');
      navigate('/booking-confirmation', { 
        state: { 
          appointment_id: response.appointment_id,
          doctor: selectedDoctor,
          date: selectedDate,
          time: selectedTime
        } 
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Booking failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];
    const firstDay = firstDayOfMonth(year, month);
    const totalDays = daysInMonth(year, month);

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  };

  // 1. FIX CALENDAR DATE SELECTION
  const isPastDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today; // 1. date < currentDate disables selection
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(dateString);
    setSelectedTime(null);
    setSelectedSlotId(null);
    // 2. Load available slots is handled by useEffect listening to selectedDate in standard patterns, 
    // but here we just need to ensure the UI filters. fetchAvailability is triggered by step 3.
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newMonth);
  };

  return (
    <ScreenContainer
      title={
        step === 1 ? 'Select Doctor' :
        step === 2 ? 'Doctor Profile' :
        'Select Time'
      }
      showBack
      onBack={() => {
        if (step === 1) {
          const dashboardPath = 
            role === 'doctor' ? '/doctor-dashboard' :
            role === 'admin' ? '/admin-dashboard' :
            '/patient-dashboard';
          navigate(dashboardPath);
        } else {
          setStep(prev => Math.max(1, prev - 1));
        }
      }}
      className="bg-surface"
    >
      <div className="px-6 py-4 pb-8">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-text-secondary mb-2">
              Available specialists near you
            </p>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : doctors.length > 0 ? (
              doctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  {...doc}
                  onBook={() => handleDoctorSelect(doc)}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <p className="text-text-secondary">No doctors available</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedDoctor && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img
                  src={`http://localhost:5000/uploads/doctors/${selectedDoctor.id}.jpg`}
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300';
                  }}
                  alt={selectedDoctor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                {selectedDoctor.name}
              </h2>
              <p className="text-primary font-medium">
                {selectedDoctor.specialization}
              </p>

              <div className="flex items-center gap-1 mt-2">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-text-primary">
                  {selectedDoctor.rating || '4.5'}
                </span>
                <span className="text-text-secondary">
                  ({selectedDoctor.reviews || '50'} reviews)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card className="flex flex-col items-center justify-center p-3 gap-1 bg-blue-50 border-blue-100">
                <Award size={20} className="text-primary" />
                <span className="font-bold text-text-primary text-sm whitespace-nowrap">
                  {selectedDoctor.experience || '5+ Years'}
                </span>
                <span className="text-[10px] text-text-secondary">Experience</span>
              </Card>
              <Card className="flex flex-col items-center justify-center p-3 gap-1 bg-green-50 border-green-100">
                <DollarSign size={20} className="text-success" />
                <span className="font-bold text-text-primary text-sm whitespace-nowrap">
                  ${selectedDoctor.fee || '50'}
                </span>
                <span className="text-[10px] text-text-secondary">Fee</span>
              </Card>
              <Card className="flex flex-col items-center justify-center p-3 gap-1 bg-purple-50 border-purple-100">
                <Globe size={20} className="text-purple-500" />
                <span className="font-bold text-text-primary text-sm whitespace-nowrap">
                  {selectedDoctor.languages ? selectedDoctor.languages.split(',').length : '2'}
                </span>
                <span className="text-[10px] text-text-secondary">Languages</span>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-text-primary">About Doctor</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {selectedDoctor.bio || `Dr. ${selectedDoctor.name.split(' ').pop()} is a highly experienced specialist dedicated to providing comprehensive care. Known for a patient-centric approach and accurate diagnoses.`}
              </p>
            </div>

            <Button fullWidth onClick={handleStartBooking} isLoading={isLoading}>
              Book Appointment
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <DoctorCard {...selectedDoctor} compact />

            {/* Calendar UI */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <CalendarIcon size={18} className="text-primary" />
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} />;
                  const isSelected = selectedDate === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
                  const past = isPastDate(day);
                  
                  return (
                    <button
                      key={day}
                      disabled={past} // 1. Only disable past dates
                      onClick={() => handleDateSelect(day)}
                      className={`
                        h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
                        ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-110' : 'text-text-primary hover:bg-primary/5'}
                        ${past ? 'text-gray-200 pointer-events-none' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary">Available Slots</h3>
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Clock size={12} />
                  {selectedDate}
                </span>
              </div>

              {/* 2. LOAD SLOTS BASED ON SELECTED DATE & 3. FIX SLOT SELECTION STATE */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots
                  .filter(slot => slot.date === selectedDate) // 2. Filter locally by selectedDate
                  .map((slot) => {
                  const isBooked = slot.is_booked;
                  const isSelected = selectedSlotId === (slot.id || slot.availability_id);

                  return (
                    <button
                      key={slot.id || slot.availability_id}
                      onClick={() => {
                        if (isBooked) {
                            // 3. Show popup for booked slot
                            alert("This slot is already booked.");
                            return;
                        }
                        setSelectedSlotId(slot.id || slot.availability_id);
                        setSelectedTime(slot.time_slot);
                      }}
                      className={`
                        relative py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all overflow-hidden
                        ${isBooked ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed opacity-60' : 
                          isSelected ? 'border-primary bg-primary text-white shadow-md' : 
                          'border-gray-50 bg-white text-gray-600 hover:border-primary/20'}
                      `}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isBooked && <Lock size={12} />}
                        {slot.time_slot}
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* 2. No slots message */}
              {availableSlots.filter(s => s.date === selectedDate).length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <p className="text-text-secondary text-sm">No available slots for this date.</p>
                </div>
              )}
            </div>

            <Button
              fullWidth
              disabled={!selectedTime}
              isLoading={isLoading}
              onClick={handleConfirmBooking}
              className="mt-4 shadow-xl shadow-primary/20"
            >
              Confirm Booking
            </Button>
          </div>
        )}
      </div>
    </ScreenContainer>
  );
}