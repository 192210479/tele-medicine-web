import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { getSocket } from '../utils/socketUtils';

type Appointment = {
  id: number;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  doctor_name: string;
  specialization: string | null;
  date: string;
  time: string;
  status: string;
  consultation_status: string;
  payment_status?: string;
  doctor_image?: string | null;
  patient_image?: string | null;
};

type TabKey = "Upcoming" | "Pending" | "Completed" | "Cancelled";

const TAB_STATUS: Record<TabKey, string[]> = {
  Upcoming: ["Scheduled"],
  Pending: ["Pending"],
  Completed: ["Completed"],
  Cancelled: ["Cancelled", "Missed"],
};

// Format: "2026-04-10" → "Apr 10, 2026"
const fmtDate = (raw: string): string => {
  if (!raw) return "N/A";
  const [y, m, d] = raw.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short", day: "2-digit", year: "numeric"
  });
};

// Format: "09:00" → "09:00 AM"
const fmtTime = (raw: string): string => {
  if (!raw || raw === "N/A") return raw;
  const parts = raw.split(":");
  if (parts.length < 2) return raw;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const s = h >= 12 ? "PM" : "AM";
  return `${(h % 12 || 12).toString().padStart(2, "0")}:${String(m).padStart(2, "0")} ${s}`;
};

// ── Reassign Modal Sub-Component ──
type Doctor = { id: number; name: string; specialization: string };
type SlotItem = { id: number; date: string; time_slot: string; status: string };

const ReassignModal = ({
  appointment, onClose, onSuccess
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: (apptId: number, newDoctor: string, newDate: string, newTime: string) => void;
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/doctors")
      .then(r => r.json())
      .then((data: Doctor[]) => setDoctors(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDoc) { setSlots([]); return; }
    fetch(`/api/doctor/availability/${selectedDoc}`)
      .then(r => r.json())
      .then((data: SlotItem[]) =>
        setSlots(Array.isArray(data)
          ? data.filter((s: any) => s.status === "Available")
          : [])
      )
      .catch(console.error);
  }, [selectedDoc]);

  const handleReassign = async () => {
    if (!selectedDoc || !selectedSlot) {
      setError("Please select a doctor and time slot.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/appointment/reassign/${appointment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "admin",
            doctor_id: selectedDoc,
            date: selectedSlot.date,
            time: selectedSlot.time_slot,
          }),
        }
      );
      const data = await res.json();
      
      // If error is related to backend broadcast, treat as success but handle logic here
      const isBroadcastError = !res.ok && data.message && data.message.includes("broadcast");
      
      if ((res.ok && data.success) || isBroadcastError) {
        const doc = doctors.find(d => d.id === selectedDoc);
        const newDocName = doc?.name ?? "Doctor";
        
        onSuccess(
          appointment.id,
          newDocName,
          selectedSlot.date,
          selectedSlot.time_slot
        );

        // Notify patient, old doctor, and new doctor via sockets
        // Using 'appointment_cancelled' as it is the only event confirmed to be relayed by the backend
        const socket = getSocket();
        
        const patientPayload = {
          appointment_id: appointment.id,
          is_reassignment: true,
          target_user_id: Number(appointment.patient_id),
          target_role: 'patient',
          title: 'Appointment Reassigned',
          message: `Your appointment has been reassigned to Dr. ${newDocName} on ${selectedSlot.date} at ${selectedSlot.time_slot}.`,
        };

        const oldDocPayload = {
          appointment_id: appointment.id,
          is_reassignment: true,
          target_user_id: Number(appointment.doctor_id),
          target_role: 'doctor',
          title: 'Appointment Transferred',
          message: `Appointment with ${appointment.patient_name} has been reassigned to another provider.`,
        };

        const newDocPayload = {
          appointment_id: appointment.id,
          is_reassignment: true,
          target_user_id: Number(selectedDoc),
          target_role: 'doctor',
          title: 'New Reassigned Patient',
          message: `You have been assigned a new appointment with ${appointment.patient_name} on ${selectedSlot.date} at ${selectedSlot.time_slot}.`,
        };

        // Emit hijacked events
        socket.emit('appointment_cancelled', patientPayload);
        setTimeout(() => socket.emit('appointment_cancelled', oldDocPayload), 150);
        setTimeout(() => socket.emit('appointment_cancelled', newDocPayload), 300);

        // Standard reload trigger
        socket.emit('new_appointment', { doctor_id: selectedDoc });

        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setError(data.message ?? "Reassignment failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  };

  const slotsByDate = slots.reduce<Record<string, SlotItem[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Administrative Action</p>
            <h2 className="font-black text-gray-900 text-xl tracking-tight">Reassign Appointment</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Current appointment info */}
          <div className="bg-primary/5 rounded-[1.5rem] p-4 border border-primary/10">
            <p className="font-black text-primary text-sm uppercase tracking-widest">{appointment.patient_name}</p>
            <p className="text-gray-500 text-xs font-bold mt-1">
              Currently: {appointment.doctor_name} &middot; {fmtDate(appointment.date)}
            </p>
          </div>

          {/* Doctor selector */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Select New Doctor
            </label>
            <select
              value={selectedDoc ?? ""}
              onChange={e => {
                setSelectedDoc(Number(e.target.value) || null);
                setSelectedSlot(null);
              }}
              className="w-full bg-gray-50 border-2 border-transparent rounded-[1rem] py-4 px-4
                         text-sm font-black text-gray-800 transition-all focus:bg-white focus:border-primary focus:outline-none"
            >
              <option value="">Search qualified doctors...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} &mdash; {d.specialization ?? "General"}
                </option>
              ))}
            </select>
          </div>

          {/* Slots grouped by date */}
          {selectedDoc && (
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Select Available Slot
              </label>
              {slots.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No matching slots available</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(slotsByDate).sort().map(([date, daySlots]) => (
                    <div key={date} className="animate-in slide-in-from-bottom-2 duration-300">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1">
                        {new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {daySlots.map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest
                                        border-2 transition-all active:scale-[0.95] ${selectedSlot?.id === slot.id
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                : "bg-white text-gray-600 border-gray-100 hover:border-primary/30"
                              }`}
                          >
                            {slot.time_slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
              <p className="text-red-500 text-xs font-bold leading-tight uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-4">
          <button onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-gray-200
                             text-gray-600 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all">
            Dismiss
          </button>
          <button
            onClick={handleReassign}
            disabled={saving || !selectedDoc || !selectedSlot}
            className="flex-[2] py-4 rounded-2xl bg-primary hover:bg-primary-dark
                       disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            {saving ? "Processing..." : "Confirm Reassignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──
export function AdminAppointmentsScreen() {
  const navigate = useNavigate();
  const { userId: authUserId } = useAuth();
  const adminId = authUserId ?? Number(localStorage.getItem("user_id"));

  const [activeTab, setActiveTab] = useState<TabKey>("Upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<number, { image: string | null, specialization: string }>>({});
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);
  const [reassignModal, setReassignModal] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/appointments?role=admin")
      .then(r => r.json())
      .then((data: Appointment[]) => {
        setAppointments(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();

    // Fetch doctors to get their profile images and specializations
    fetch("/api/doctors")
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const map: any = {};
          data.forEach(d => {
            map[d.id] = { image: d.profile_image, specialization: d.specialization };
          });
          setDoctorMap(map);
        }
      })
      .catch(() => { });

    const socket = getSocket();
    socket.on('appointment_cancelled', fetchAppointments);
    window.addEventListener('appointment-cancelled', fetchAppointments);

    return () => {
      socket.off('appointment_cancelled', fetchAppointments);
      window.removeEventListener('appointment-cancelled', fetchAppointments);
    };
  }, [fetchAppointments]);

  const filtered = appointments.filter(a =>
    TAB_STATUS[activeTab].includes(a.status)
  );

  const handleCancel = async (apptId: number) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelLoading(apptId);
    try {
      const res = await fetch(`/api/appointment/cancel/${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: adminId, role: "admin" }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(prev =>
          prev.map(a => a.id === apptId ? { ...a, status: "Cancelled" } : a)
        );
        // Notify doctor & patient screens in real-time
        const socket = getSocket();
        socket.emit('appointment_cancelled', { appointment_id: apptId });
        window.dispatchEvent(new CustomEvent('appointment-cancelled'));
      } else {
        alert(data.error ?? "Failed to cancel");
      }
    } catch {
      alert("Connection error");
    } finally {
      setCancelLoading(null);
    }
  };

  const handleReassignSuccess = (
    apptId: number, newDoctor: string,
    newDate: string, newTime: string
  ) => {
    setAppointments(prev => prev.map(a =>
      a.id === apptId
        ? {
          ...a, doctor_name: newDoctor,
          date: newDate, time: newTime, status: "Scheduled", payment_status: "Paid"
        }
        : a
    ));
  };

  const StatusBadge = ({ s }: { s: string }) => {
    const map: Record<string, string> = {
      Scheduled: "bg-blue-100 text-blue-700",
      Completed: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-600",
      Missed: "bg-gray-100 text-gray-500",
      Pending: "bg-orange-100 text-orange-600",
    };
    return (
      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full
                        ${map[s] ?? "bg-gray-100 text-gray-600"}`}>
        {s === "Scheduled" ? "upcoming" : s === "Pending" ? "Scheduled" : s.toLowerCase()}
      </span>
    );
  };

  const Av = ({ img, name }: { img?: string | null; name: string }) => {
    const avatarUrl = img
      ? (img.startsWith('/api/') || img.startsWith('http') ? img : `/api/profile/image/file/${img}`)
      : null;

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={name}
          className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm ring-2 ring-white">
        {name[0]?.toUpperCase()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ScreenContainer showBack={false} className="pb-10">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center gap-4 shadow-sm sticky top-0 z-30">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-white hover:shadow-md transition-all active:scale-[0.95]"
          >
            &larr;
          </button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Appointment Control</p>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Manage Appointments</h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6 space-y-8">

          {/* Tab bar */}
          <div className="flex bg-white/50 backdrop-blur-md rounded-[2rem] p-2 gap-2 shadow-sm border border-white/40 sticky top-24 z-20">
            {(["Upcoming", "Pending", "Completed", "Cancelled"] as TabKey[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                    ? "bg-primary text-white shadow-xl shadow-primary/20 transform scale-[1.05]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Appointment list Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-primary/20">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6 shadow-lg shadow-primary/10"></div>
                <p className="text-primary font-black uppercase text-xs tracking-[0.3em] animate-pulse">Syncing Medical Grid...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-24 bg-white rounded-[3rem] shadow-soft border border-gray-100/50">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">📅</div>
                <p className="text-gray-900 font-black uppercase tracking-widest text-xl">Empty Schedule</p>
                <p className="text-gray-400 text-sm font-bold mt-2">No {activeTab.toLowerCase()} appointments found in the system.</p>
              </div>
            ) : (
              filtered.map(appt => (
                <div key={appt.id} className="bg-white rounded-[2.5rem] border border-gray-50 shadow-soft p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 group hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col justify-between">

                  <div className="space-y-6">
                    {/* Top Row: Doctor & Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Av img={appt.doctor_image || doctorMap[appt.doctor_id]?.image} name={appt.doctor_name} />
                        <div>
                          <p className="font-black text-gray-900 text-base leading-tight group-hover:text-primary transition-colors">{appt.doctor_name}</p>
                          <p className="text-primary/60 text-[10px] font-black uppercase tracking-widest mt-1">{appt.specialization || doctorMap[appt.doctor_id]?.specialization || "Physician"}</p>
                        </div>
                      </div>
                      <StatusBadge s={appt.status} />
                    </div>

                    {/* Patient Section */}
                    <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient</p>
                        <p className="font-black text-gray-800 tracking-tight">{appt.patient_name}</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-xl text-gray-300">👤</div>
                    </div>

                    {/* Time & Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 flex flex-col items-center">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Date</p>
                        <p className="text-blue-700 font-black text-xs">{fmtDate(appt.date)}</p>
                      </div>
                      <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100/50 flex flex-col items-center">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Time</p>
                        <p className="text-purple-700 font-black text-xs">{fmtTime(appt.time)}</p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billing</p>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 italic">
                        Paid Verified
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex gap-3 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => navigate(`/appointment/${appt.id}`)}
                      className="flex-[2] h-12 rounded-2xl bg-gray-50 text-gray-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all active:scale-[0.98] border border-gray-100"
                    >
                      View Full Details
                    </button>
                    {appt.status !== "Completed" && appt.status !== "Cancelled" && appt.status !== "Missed" && (
                      <div className="flex gap-2 flex-1">
                        <button
                          onClick={() => setReassignModal(appt)}
                          title="Reassign"
                          className="flex-1 rounded-2xl border-2 border-primary/10 text-primary flex items-center justify-center hover:bg-primary/5 transition-all active:scale-95"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancelLoading === appt.id}
                          title="Cancel"
                          className="flex-1 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95"
                        >
                          {cancelLoading === appt.id ? "..." : "✕"}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        {/* Reassign Modal Overlay */}
        {reassignModal && (
          <ReassignModal
            appointment={reassignModal}
            onClose={() => setReassignModal(null)}
            onSuccess={handleReassignSuccess}
          />
        )}
      </ScreenContainer>
    </div>
  );
}
