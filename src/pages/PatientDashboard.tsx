import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile, useDisplayName } from '../context/ProfileContext';
import { sortAscending, fmtTime, parseLocalDate } from '../utils/dateUtils';
import { getSocket } from '../utils/socketUtils';
import { aiService, dashboardService } from '../services/api';

type ApptItem = {
  id: number;
  doctor_id: number;
  doctor_name: string;
  specialization: string | null;
  doctor_image: string | null;
  date: string;
  time: string;
  status: string;
  consultation_status: string;
};

// ── SVG icon components ──────────────────────────────────────
function IconCalendar({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
    </svg>
  );
}
function IconClock({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
    </svg>
  );
}
function IconPrescription({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );
}
function IconActivity({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.5 18.5l6-6 4 4L22 6.92M22 6.92V12M22 6.92H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
function IconFolder({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
}
function IconBell({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}
function IconUpload({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
    </svg>
  );
}
function IconSearch({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}
function IconHeadphones({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
    </svg>
  );
}
function IconWave({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────
export function PatientDashboard() {
  const navigate = useNavigate();
  const { userId: authId } = useAuth();
  const { profile } = useProfile();
  const displayName = useDisplayName();
  const patientId = authId ?? Number(localStorage.getItem("user_id"));

  const [upcoming, setUpcoming] = useState<ApptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dashStats, setDashStats] = useState<any>(null);
  const [healthTip, setHealthTip] = useState<string>("Fetching your personalized health tip...");

  // 1. Fetch unread notifications count and health tip
  useEffect(() => {
    if (!patientId) return;

    // Fetch notifications count
    fetch(`/api/notifications?user_id=${patientId}&role=patient`)
      .then(r => r.ok ? r.json() : { unread_count: 0 })
      .then((data: any) => {
        const count = data.unread_count ?? (Array.isArray(data) ? data.filter((n: any) => !n.is_read).length : 0);
        const local = JSON.parse(localStorage.getItem('local_notifications') || '[]');
        const localUnread = local.filter((n: any) => !n.is_read).length;
        setUnreadCount(count + localUnread);
      })
      .catch(() => { });

    // Fetch daily health tip
    aiService.getDailyHealthTip(patientId)
      .then(res => {
        if (res.tip) setHealthTip(res.tip);
      })
      .catch(err => {
        console.error("AI Tip Error:", err);
        setHealthTip("Drink enough water, eat balanced meals, and take short breaks to stay healthy today.");
      });
  }, [patientId]);

  const fetchDashboardData = useCallback(() => {
    if (!patientId) return;
    fetch(`/api/my-appointments?user_id=${patientId}&role=patient&status=Scheduled`)
      .then(r => r.json())
      .then(appts => {
        const sorted = sortAscending(Array.isArray(appts) ? appts : []);
        setUpcoming(sorted);
      }).catch(err => {
        console.error(err);
      });

    dashboardService.getStats(patientId, "patient")
      .then(res => {
        setDashStats(res);
      }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [patientId]);

  // 2. Real-time socket updates for unread count + cancellations
  useEffect(() => {
    const socket = getSocket();
    const inc = () => setUnreadCount(c => c + 1);
    const handleCancelled = () => { if (patientId) fetchDashboardData(); };

    const handleNewNotif = (data: any) => {
      inc();
      const msg = data?.message || data?.description || data?.text;
      if (msg) {
        window.alert(`🔔 Notification: ${data.title || 'Update'}\n\n${msg}`);
      }
      fetchDashboardData();
    };

    socket.on('new_notification', handleNewNotif);
    socket.on('medication_reminder', inc);
    socket.on('appointment_cancelled', handleCancelled);
    socket.on('appointment_reassigned', handleNewNotif); // Show alert + refresh

    return () => {
      socket.off('new_notification', handleNewNotif);
      socket.off('medication_reminder', inc);
      socket.off('appointment_cancelled', handleCancelled);
      socket.off('appointment_reassigned', handleCancelled);
    };
  }, [patientId, fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const refresh = () => { if (!document.hidden && patientId) fetchDashboardData(); };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("appointment-booked", fetchDashboardData as EventListener);
    window.addEventListener("appointment-cancelled", fetchDashboardData as EventListener);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("appointment-booked", fetchDashboardData as EventListener);
      window.removeEventListener("appointment-cancelled", fetchDashboardData as EventListener);
    };
  }, [patientId, fetchDashboardData]);

  const nextAppt = upcoming[0] ?? null;

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Synchronizing Your Health Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-5">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-gray-400 text-sm">{dashStats && dashStats.greeting ? dashStats.greeting : "Hello"},</p>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:shadow-md transition-all active:scale-95"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Emergency + Health Tip row ── */}
        <div className="flex flex-col md:flex-row gap-3">

          {/* Emergency Help */}
          <div
            onClick={() => navigate("/emergency-help")}
            className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-500 text-sm">Emergency Help</p>
              <p className="text-gray-400 text-[11px] leading-tight mt-0.5">
                Call ambulance, contacts &amp; hospitals
              </p>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </div>

          {/* Daily Health Tip */}
          <div className="flex-1 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 flex-shrink-0 mt-0.5">
              <IconWave className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-blue-600 text-sm">Daily Health Tip</p>
              <p className="text-gray-500 text-[11px] leading-relaxed mt-1">
                {healthTip}
              </p>
            </div>
          </div>

        </div>


        {/* ── Services ── */}
        <div>
          <p className="font-bold text-gray-800 text-lg mb-3">Services</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { Icon: IconCalendar, label: "Book Appointment", color: "bg-blue-500", path: "/book-appointment" },
              { Icon: IconSearch, label: "Symptom Checker", color: "bg-indigo-500", path: "/symptom-checker" },
              { Icon: IconClock, label: "Upcoming", color: "bg-teal-500", path: "/upcoming-appointments" },
              { Icon: IconPrescription, label: "Prescriptions", color: "bg-orange-400", path: "/prescriptions" },
              { Icon: IconActivity, label: "History", color: "bg-purple-500", path: "/history" },
              { Icon: IconFolder, label: "Medical Records", color: "bg-purple-600", path: "/medical-records" },
              { Icon: IconBell, label: "Reminders", color: "bg-pink-500", path: "/medication-reminders" },
            ].map(s => (
              <div
                key={s.label}
                onClick={() => navigate(s.path)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition aspect-square"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${s.color}`}>
                  <s.Icon className="w-7 h-7" />
                </div>
                <p className="text-gray-700 text-xs font-bold text-center leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
