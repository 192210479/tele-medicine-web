import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSocket } from "../utils/socketUtils";

interface DoctorInfo {
  name: string;
  specialization: string;
}

export default function PrescriptionWaitingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    appointment_id: number; consultation_id?: number; appointment?: any;
  };

  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guard — no state, bounce back
  useEffect(() => {
    if (!state?.appointment_id) {
      navigate("/upcoming-appointments", { replace: true });
    }
  }, [state, navigate]);

  // ── Fetch real doctor info ──────────────────────────────────
  useEffect(() => {
    if (!state?.appointment_id) return;

    if (state.appointment) {
      setDoctor({
        name: state.appointment.doctor_name || "Your Doctor",
        specialization: state.appointment.specialization || "Specialist",
      });
      return;
    }

    async function loadDoctorInfo() {
      try {
        const detailRes = await fetch(`/api/consultation/details/${state.appointment_id}`);
        if (!detailRes.ok) return;
        const detail = await detailRes.json();
        if (!detail.doctor_id) return;

        const profileRes = await fetch(`/api/profile?user_id=${detail.doctor_id}&role=doctor`);
        if (!profileRes.ok) return;
        const profile = await profileRes.json();

        setDoctor({
          name: profile.full_name || "Your Doctor",
          specialization: profile.specialization || "Specialist",
        });
      } catch { /* silent */ }
    }

    loadDoctorInfo();
  }, [state]);

  // ── REAL-TIME: Listen for prescription_ready ────────────────
  useEffect(() => {
    if (!state?.appointment_id) return;

    const socket = getSocket();
    socket.emit("join_room", { room: `consultation_${state.appointment_id}` });

    const handlePrescriptionReady = (data: any) => {
      console.log("[Prescription] Received prescription_ready:", data);
      if (Number(data.appointment_id) === Number(state.appointment_id)) {
        navigate("/consultation/prescription-ready", {
          state: {
            appointment_id: state.appointment_id,
            doctor,
          },
          replace: true,
        });
      }
    };

    socket.on("prescription_ready", handlePrescriptionReady);
    
    // Fallback polling (less frequent now)
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/prescription/status/${state.appointment_id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "Ready" || data.status === "Finalized") {
             handlePrescriptionReady({ appointment_id: state.appointment_id });
          }
        }
      } catch {}
    };
    const interval = setInterval(checkStatus, 5000);

    return () => {
      socket.off("prescription_ready", handlePrescriptionReady);
      clearInterval(interval);
    };
  }, [state?.appointment_id, doctor, navigate]);

  // ── Cosmetic wait timer ─────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setWaitSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function formatWait(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* Prescription icon */}
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center uppercase tracking-tight">
        Creating Prescription
      </h1>
      <p className="text-gray-500 text-sm mb-3 text-center font-medium">
        Please wait while your doctor prepares your medical report
      </p>

      <div className="flex items-center gap-2 text-primary font-black text-xs mb-8 bg-blue-50 px-4 py-2 rounded-full">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>STATUS: {formatWait(waitSeconds)} • SYNCING</span>
      </div>

      <div className="w-full max-w-md bg-white border border-gray-100 rounded-[2rem] shadow-soft p-8 mb-8 text-center">
         <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <CheckCircleIcon />
         </div>
         <h3 className="font-black text-gray-900 text-lg mb-1 leading-tight">
           {doctor ? `Dr. ${doctor.name}` : "Your Specialist"}
         </h3>
         <p className="text-primary font-black uppercase text-[10px] tracking-widest mb-6 leading-none opacity-60">
           {doctor ? doctor.specialization : "Medical Specialist"}
         </p>
         <div className="h-px bg-gray-100 w-full mb-6" />
         <p className="text-gray-400 text-xs font-bold leading-relaxed uppercase">
           Secure session finalized. Doctor is completing documentation and clinical notes.
         </p>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function CheckCircleIcon() {
    return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    );
}
