import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Star, Globe, DollarSign, Award, Clock } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { DoctorCard } from '../components/ui/DoctorCard';
import { DatePicker } from '../components/ui/DatePicker';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

import socketService from '../services/consultationSocket';
import { useAuth } from '../context/AuthContext';

interface SlotType {
  id: number;
  doctor_id: number;
  date: string;        // "YYYY-MM-DD"
  time_slot: string;   // "HH:MM"
  status: 'Available' | 'Booked';
}

// ── IST-aware slot validity check ──────────────────────────────────────
function isSlotStillValid(slotDate: string, slotTime: string): boolean {
  const nowIST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const [year, month, day] = slotDate.split("-").map(Number);
  const [hours, minutes] = String(slotTime).slice(0, 5).split(":").map(Number);
  const slotDateTime = new Date(year, month - 1, day, hours, minutes, 0);
  return slotDateTime > nowIST;
}

export function AppointmentBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // @ts-ignore
  const { userId } = useAuth();

  // Guaranteed resolver — tries auth context first, then localStorage
  const getPatientId = (): number | null => {
    // From auth context
    if (userId) return Number(userId);

    // From localStorage — try every common key name your app might use
    const keys = ["user_id", "userId", "id", "patient_id", "auth_token"];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val && !isNaN(Number(val))) return Number(val);
    }

    // From sessionStorage fallback
    const keys2 = ["user_id", "userId", "id"];
    for (const key of keys2) {
      const val = sessionStorage.getItem(key);
      if (val && !isNaN(Number(val))) return Number(val);
    }

    return null;
  };

  const doctorId = location.state?.doctorId ?? params.doctorId;

  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);

  const [filteredSlots, setFilteredSlots] = useState<any[]>([]);

  const fetchSlots = useCallback(async (docId: string) => {
    if (!docId) {
      console.warn("Doctor ID missing, skipping fetch");
      return;
    }
    console.log("Doctor ID:", docId);
    try {
      const res = await fetch(`/api/doctor/availability/${docId}`);

      if (!res.ok) {
        console.error("API error:", res.status);
        return;
      }

      const data = await res.json();
      console.log("Slots:", data);
      const available = data.filter((s: SlotType) => s.status === 'Available');
      setSlots(data); // Store all data, but maybe filter later or use filteredSlots

      // Auto-select first available date if none selected
      if (!selectedDate && data.length > 0) {
        const firstAvailable = data.find((s: any) => s.status === 'Available');
        if (firstAvailable) setSelectedDate(firstAvailable.date);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  }, [selectedDate]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        const mappedDoctors = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          specialty: d.specialization || 'Specialist',
          rating: d.rating || 0,
          reviews: d.reviews_count || 0,
          experience: `${d.experience || 0} Years`,
          languages: typeof d.languages === 'string' ? d.languages.split(', ') : [],
          fee: `₹${d.fee || 0}`,
          image: d.profile_image || null,
        }));
        setDoctors(mappedDoctors);

        if (doctorId) {
          const docIdNum = typeof doctorId === 'string' ? parseInt(doctorId, 10) : doctorId;
          const preselectedDoc = mappedDoctors.find((d: any) => d.id === docIdNum);
          if (preselectedDoc) {
            setSelectedDoctor(preselectedDoc);
            setStep(2); // Skip Step 1 and go to Doctor Profile
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [doctorId, setDoctors, doctorId]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    socketService.connect();
    const handleRatingUpdate = () => {
      fetchDoctors();
    };

    socketService.on('rating_updated', handleRatingUpdate);
    window.addEventListener('rating-updated', handleRatingUpdate);
    window.addEventListener('focus', handleRatingUpdate);

    return () => {
      socketService.off('rating_updated', handleRatingUpdate);
      window.removeEventListener('rating-updated', handleRatingUpdate);
      window.removeEventListener('focus', handleRatingUpdate);
    };
  }, [fetchDoctors]);

  useEffect(() => {
    if (!selectedDoctor?.id) return;

    socketService.connect();
    const handleRefresh = () => fetchSlots(selectedDoctor.id);

    socketService.on('slot_updated', handleRefresh);
    socketService.on('appointment_booked', handleRefresh);

    const interval = setInterval(() => {
      if (selectedDoctor?.id) fetchSlots(selectedDoctor.id);
    }, 30000);

    window.addEventListener('focus', handleRefresh);

    return () => {
      socketService.off('slot_updated', handleRefresh);
      socketService.off('appointment_booked', handleRefresh);
      clearInterval(interval);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [selectedDoctor?.id, fetchSlots]);

  useEffect(() => {
    if (selectedDoctor && doctors.length > 0) {
      const updated = doctors.find(d => d.id === selectedDoctor.id);
      if (updated) setSelectedDoctor(updated);
    }
  }, [doctors]);

  // Filter slots by selected date AND remove already-passed time slots
  useEffect(() => {
    if (slots.length > 0 && selectedDate) {
      const filtered = slots.filter(slot => {
        const { date, status, is_booked } = slot;

        // Robust check: must be explicitly "Available" and not marked as "is_booked" by the backend
        const isAvailable = (status === "Available" || status === "available" || status == null)
          && status !== "Booked" && status !== "booked"
          && !is_booked;

        return (
          date === selectedDate &&
          isAvailable &&
          isSlotStillValid(date, slot.time_slot) // ← IST time check
        );
      });
      console.log("Filtered Slots:", filtered);
      setFilteredSlots(filtered);
    } else {
      setFilteredSlots([]);
    }
  }, [slots, selectedDate]);

  // ── 60-second auto-refresh: re-fetch so expired slots disappear ──────
  useEffect(() => {
    if (!selectedDoctor?.id) return;
    const intervalId = setInterval(() => {
      fetchSlots(selectedDoctor.id);
    }, 60_000);
    return () => clearInterval(intervalId);
  }, [selectedDoctor?.id, fetchSlots]);

  // ── 30-second check: deselect slot if it expires while user is choosing
  useEffect(() => {
    if (!selectedSlot) return;
    const checkId = setInterval(() => {
      if (!isSlotStillValid(selectedSlot.date, selectedSlot.time_slot)) {
        setSelectedSlot(null);
      }
    }, 30_000);
    return () => clearInterval(checkId);
  }, [selectedSlot]);

  const handleDoctorSelect = async (doc: any) => {
    setSelectedDoctor(doc);
    setStep(2);
    fetchSlots(doc.id);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      alert("Please select a time slot.");
      return;
    }

    const patientId = getPatientId();

    if (!patientId) {
      alert("Session expired. Please log out and log in again.");
      return;
    }

    setIsBooking(true);

    try {
      const res = await fetch("/api/appointment/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: patientId,
          role: "patient",          // ALWAYS hardcode "patient" here
          availability_id: selectedSlot.id,    // slot's DB primary key
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Booking failed. Please try again.");
        return;
      }

      if (data.payment_required) {
        // Attempt dynamically loading Razorpay script
        const loadRazorpay = () => new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          alert("Failed to load secure payment gateway. Check your connection.");
          setIsBooking(false);
          return;
        }

        // Initialize Order from backend
        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_id: data.appointment_id,
            patient_id: patientId,
            doctor_id: data.doctor_id || selectedDoctor.id
          })
        });

        let orderData;
        try {
          orderData = await orderRes.json();
        } catch (err) {
          console.error("Failed to parse create-order response:", err);
          alert(`Backend payment initialization failed. Endpoint /api/payments/create-order might not exist or returned 500 error. Status: ${orderRes.status}`);
          setIsBooking(false);
          return;
        }

        if (!orderRes.ok) {
          alert(orderData.error ?? "Failed to initialize payment gateway.");
          setIsBooking(false);
          return;
        }

        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Telemedicine Platform",
          description: `Appointment Consultation Fee`,
          order_id: orderData.order_id,
          handler: async function (response: any) {
            try {
              // Verify transaction
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  appointment_id: data.appointment_id,
                  patient_id: patientId
                })
              });

              if (verifyRes.ok) {
                // Success: Emit real-time triggers and redirect to confirmation
                socketService.emit('appointment_booked', { doctor_id: selectedDoctor.id });
                window.dispatchEvent(new CustomEvent("appointment-booked"));

                navigate("/booking-confirmation", {
                  state: {
                    appointment_id: data.appointment_id,
                    doctor_id: data.doctor_id,
                    doctor_name: data.doctor_name,
                    specialization: data.specialization,
                    doctor_image: data.doctor_image,
                    date: data.date,
                    time: data.time,
                  },
                });
              } else {
                alert("Payment verification failed at server securely.");
              }
            } catch {
              alert("Network error during payment verification.");
            }
          },
          prefill: {
            name: "Patient Booking",
            contact: "9999999999",
            email: "patient@example.com"
          },
          theme: {
            color: "#2563eb"
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert(`Payment Failed. Reason: ${response.error.description}`);
        });
        rzp.open();
        setIsBooking(false);

      } else {
        // Fallback for non-payment flow
        socketService.emit('appointment_booked', { doctor_id: selectedDoctor.id });
        window.dispatchEvent(new CustomEvent("appointment-booked"));
        navigate("/booking-confirmation", {
          state: {
            appointment_id: data.appointment_id,
            doctor_id: data.doctor_id,
            doctor_name: data.doctor_name,
            specialization: data.specialization,
            doctor_image: data.doctor_image,
            date: data.date,
            time: data.time,
          },
        });
      }

    } catch (error: any) {
      console.error("Connection caught error:", error);
      alert(`Connection error: ${error.message || 'Unknown error'}. Check console for details.`);
      setIsBooking(false);
    }
  };

  // Extract unique dates from slots for availability dots in calendar
  const uniqueDates = Array.from(new Set(
    slots.filter(s => {
      const isAvailable = (s.status === "Available" || s.status === "available" || s.status == null)
        && s.status !== "Booked" && s.status !== "booked"
        && !s.is_booked;
      return isAvailable;
    }).map(s => s.date)
  )).sort();

  return (
    <ScreenContainer
      title={step === 1 ? 'Select Doctor' : step === 2 ? 'Doctor Profile' : 'Select Time'}
      showBack
      onBackClick={() => {
        if (step === 3) setStep(2);
        else if (step === 2) setStep(1);
        else navigate(-1);
      }}
      className="bg-surface">

      <div className="px-6 py-4 pb-8">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-text-secondary mb-2">Available specialists near you</p>
            {isLoadingDoctors ? (
              <p className="text-center text-gray-500 py-10">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No doctors available right now.</p>
            ) : (
              doctors.map((doc) => (
                <DoctorCard key={doc.id} {...doc} location={doc.location} onBook={() => handleDoctorSelect(doc)} />
              ))
            )}
          </div>
        )}

        {step === 2 && selectedDoctor && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              {selectedDoctor.image ? (
                <img
                  src={selectedDoctor.image.startsWith('/api/') || selectedDoctor.image.startsWith('http') ? selectedDoctor.image : `/api/profile/image/file/${selectedDoctor.image}`}
                  alt={selectedDoctor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4 bg-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md mb-4 bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-4xl">
                  {selectedDoctor.name?.[0] ?? "D"}
                </div>
              )}
              <h2 className="text-xl font-bold text-text-primary">{selectedDoctor.name}</h2>
              <p className="text-primary font-medium">{selectedDoctor.specialty}</p>

              <div className="flex items-center gap-1 mt-2">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-text-primary">{selectedDoctor.reviews === 0 ? "0.0" : selectedDoctor.rating}</span>
                <span className="text-text-secondary">({selectedDoctor.reviews} reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card className="flex flex-col items-center justify-center p-3 gap-1 bg-blue-50 border-blue-100">
                <Award size={20} className="text-primary" />
                <span className="font-bold text-text-primary text-sm">{selectedDoctor.experience}</span>
                <span className="text-[10px] text-text-secondary">Experience</span>
              </Card>
              <Card className="flex flex-col items-center justify-center p-3 gap-1 bg-green-50 border-green-100">
                <DollarSign size={20} className="text-success" />
                <span className="font-bold text-text-primary text-sm">{selectedDoctor.fee}</span>
                <span className="text-[10px] text-text-secondary">Fee</span>
              </Card>
              <Card className="flex flex-col items-center justify-center p-3 gap-1 bg-purple-50 border-purple-100">
                <Globe size={20} className="text-purple-500" />
                <span className="font-bold text-text-primary text-sm">{selectedDoctor.languages.length}</span>
                <span className="text-[10px] text-text-secondary">Languages</span>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-text-primary">About Doctor</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {selectedDoctor.name} is a highly experienced specialist dedicated to providing comprehensive care. Known for a patient-centric approach and accurate diagnoses.
              </p>
            </div>

            <Button fullWidth onClick={() => setStep(3)}>Book Appointment</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <DoctorCard {...selectedDoctor} location={selectedDoctor.location} compact />

            <div>
              <h3 className="font-bold text-text-primary mb-3">Select Date</h3>
              <DatePicker
                selectedDate={selectedDate}
                onSelect={(date: string) => { setSelectedDate(date); setSelectedSlot(null); }}
                availableDates={uniqueDates}
              />
            </div>

            <div>
              <h3 className="font-bold text-text-primary mb-3">Available Slots</h3>
              {filteredSlots.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {selectedDate ? 'No availability slots found for this date.' : 'Pick a date to see available slots.'}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredSlots.map((slot: any) => {
                    // Extract HH:mm from "HH:mm:ss" or "HH:mm" slot backend string
                    const timeDisp = String(slot.time_slot).slice(0, 5);
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${isSelected ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-200 bg-white text-text-primary hover:border-primary/50'
                          }`}
                      >
                        {timeDisp}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              fullWidth
              disabled={!selectedSlot || isBooking}
              isLoading={isBooking}
              onClick={handleConfirmBooking}
              className="mt-4"
            >
              Confirm Booking
            </Button>
          </div>
        )}
      </div>
    </ScreenContainer>
  );
}
