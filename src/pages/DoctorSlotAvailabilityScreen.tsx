import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, CheckCircle, Timer, Trash2 } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getSocket } from '../utils/socketUtils';
import { useAuth } from '../context/AuthContext';

interface SlotType {
  id: number;
  doctor_id: number;
  date: string;    // "YYYY-MM-DD"
  time_slot: string;    // "HH:MM"
  is_booked?: boolean;
  status?: string;
}

export function DoctorSlotAvailabilityScreen() {
  const navigate = useNavigate();
  // @ts-ignore
  const { userId: authUserId } = useAuth();
  const userId = authUserId ?? Number(localStorage.getItem("user_id")) ?? null;

  const [slots, setSlots] = useState<SlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStart, setSelectedStart] = useState('09:00');
  const [selectedEnd, setSelectedEnd] = useState('17:00');
  const [selectedDuration, setSelectedDuration] = useState(30);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Fetch existing slots on mount
  const fetchSlots = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setFetchError(null);
    fetch(`/api/doctor/availability/${userId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: SlotType[]) => {
        setSlots(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setFetchError(`Failed to load slots: ${err.message}`);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    fetchSlots();

    const socket = getSocket();
    const eventHandler = () => fetchSlots();

    socket.on('appointment_booked', eventHandler);
    socket.on('appointment_cancelled', eventHandler);

    const interval = setInterval(fetchSlots, 10000); // Poll purely for robust fallback

    return () => {
      socket.off('appointment_booked', eventHandler);
      socket.off('appointment_cancelled', eventHandler);
      clearInterval(interval);
    };
  }, [fetchSlots]);

  const handleDeleteSlot = async (slotId: number) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/doctor/availability/${slotId}?user_id=${userId}&role=doctor`, {
        method: "DELETE"
      });
      if (res.ok) fetchSlots();
    } catch {
      console.error("Delete failed");
    }
  };

  const toISODate = (raw: string): string => {
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parts = raw.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
      ].join("-");
    }
    return raw;
  };

  const handleSync = async () => {
    if (!userId) {
      setSaveError("Not logged in. Please log in again.");
      return;
    }
    if (!selectedDate) {
      setSaveError("Please select a date.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/doctor/availability/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          role: "doctor",
          date: toISODate(selectedDate),
          start_time: selectedStart,
          end_time: selectedEnd,
          slot_duration: selectedDuration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save slots. Please try again.");
        return;
      }

      setSaveSuccess(
        `✓ ${data.created ?? "New"} slots created for ${data.date ?? toISODate(selectedDate)}`
      );
      fetchSlots();   // refresh the active schedule immediately

    } catch {
      setSaveError("Connection error while saving availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Filter: only present/future slots.
  // Use new Date() directly — the machine is already in IST, no conversion needed.
  // The old toLocaleString("en-US",{timeZone:"Asia/Kolkata"}) caused a double-conversion
  // bug that made nowMinutes appear ~5:30h ahead, hiding valid future slots.
  const visibleSlots = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");

    const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return slots.filter(s => {
      if (s.date > todayKey) return true;   // future date — always show
      if (s.date < todayKey) return false;  // past date — hide

      // Today: compare as numeric minutes (handles "HH:MM" and "HH:MM:SS")
      const parts = String(s.time_slot).split(":");
      const slotMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      return slotMinutes > nowMinutes;      // only show strictly future slots
    });
  }, [slots]);

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, SlotType[]> = {};
    visibleSlots.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [visibleSlots]);

  const sortedDates = Object.keys(grouped).sort();

  return (
    <ScreenContainer
      title="Real-Time Slot Management"
      showBack
      onBackClick={() => navigate('/doctor-dashboard')}
      className="pb-10 bg-[#F5F7FB]"
    >
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* CREATE SLOTS PANEL */}
        <Card className="p-8 border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Timer size={120} />
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 relative z-10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Plus size={24} />
            </div>
            Generate Availability Blocks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 h-14 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-900 focus:border-primary outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start</label>
              <input
                type="time"
                value={selectedStart}
                onChange={(e) => setSelectedStart(e.target.value)}
                className="w-full px-4 h-14 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-900 focus:border-primary outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End</label>
              <input
                type="time"
                value={selectedEnd}
                onChange={(e) => setSelectedEnd(e.target.value)}
                className="w-full px-4 h-14 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-900 focus:border-primary outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration (Mins)</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full px-4 h-14 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-900 focus:border-primary outline-none"
              >
                <option value={15}>15 Mins</option>
                <option value={30}>30 Mins</option>
                <option value={60}>60 Mins</option>
              </select>
            </div>

            <div className="md:col-span-4 pt-4">
              <button
                type="button"
                onClick={handleSync}
                disabled={saving || !userId}
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "SAVING..." : "SYNC AVAILABILITY TO SERVER"}
              </button>
            </div>
            {saveError && <p className="text-red-500 w-full col-span-4 mt-2 font-semibold">{saveError}</p>}
            {saveSuccess && <p className="text-green-600 w-full col-span-4 mt-2 font-semibold">{saveSuccess}</p>}
          </div>
        </Card>

        {/* SLOTS LIST */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Schedule</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase">Booked</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <p className="text-gray-400 text-center py-8">Loading slots...</p>
            ) : fetchError ? (
              <p className="text-red-500 text-center py-8">{fetchError}</p>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-semibold text-gray-600">NO LIVE SLOTS AVAILABLE</p>
                <p className="text-sm text-gray-400 mt-1">
                  GENERATE BLOCKS ABOVE TO SHOW UP IN PATIENT SEARCH
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDates.map(date => (
                  <div key={date}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{date}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {grouped[date].map(slot => (
                        <div
                          key={slot.id}
                          className={`relative group rounded-lg p-2 text-center text-sm font-medium border ${(slot.is_booked || slot.status?.toLowerCase() === "booked")
                              ? "bg-gray-100 border-gray-300 text-gray-400"
                              : "bg-green-50 border-green-400 text-green-700 hover:border-red-400 transition-colors"
                            }`}
                        >
                          <p className="font-bold">{slot.time_slot}</p>
                          <span className={`text-xs ${(slot.is_booked || slot.status?.toLowerCase() === "booked") ? "text-gray-400" : "text-green-600"
                            }`}>
                            {(slot.is_booked || slot.status?.toLowerCase() === "booked") ? "● BOOKED" : "● AVAILABLE"}
                          </span>

                          {!(slot.is_booked || slot.status?.toLowerCase() === "booked") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(slot.id);
                              }}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Slot"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}
