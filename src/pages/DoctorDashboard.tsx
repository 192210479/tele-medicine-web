import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../utils/socketUtils';
import {
  Users,
  Clock,
  Calendar,
  IndianRupee,
  Video,
  Bell,
  CheckCircle,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile, useDisplayName } from '../context/ProfileContext';
import { Card } from '../components/ui/Card';

type ApptItem = {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_image: string | null;
  date: string;
  time: string;
  status: string;
  consultation_status: string;
};

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { userId: authId } = useAuth();
  const { profile } = useProfile();
  const displayName = useDisplayName();
  const doctorId = authId ?? Number(localStorage.getItem("user_id"));

  const [todayAppts, setTodayAppts] = useState<ApptItem[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<ApptItem[]>([]);
  const [dashStats, setDashStats] = useState<any>({ upcoming: 0 });
  const [earnings, setEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avgRating, setAvgRating] = useState<string>('0.0');
  const [ratingCount, setRatingCount] = useState<number>(0);

  const fetchAll = useCallback(() => {
    if (!doctorId) return;
    Promise.all([
      fetch(`/api/doctor/appointments/today?doctor_id=${doctorId}`).then(r => r.json()),
      fetch(`/api/dashboard?user_id=${doctorId}&role=doctor`).then(r => r.json()),
      fetch(`/api/doctor/wallet?doctor_id=${doctorId}&role=doctor`).then(r => r.json()),
      fetch(`/api/doctor/${doctorId}/ratings`).then(r => r.json().catch(() => [])),
      fetch(`/api/my-appointments?user_id=${doctorId}&role=doctor&status=Scheduled`).then(r => r.json()),
    ]).then(([today, dash, wallet, ratings, upcoming]) => {
      setTodayAppts(Array.isArray(today) ? today : []);
      const up = Array.isArray(upcoming) ? upcoming : [];
      setUpcomingAppts(up.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      }));
      setDashStats(dash);
      setEarnings(wallet?.total_earned ?? 0);

      if (Array.isArray(ratings) && ratings.length > 0) {
        const sum = ratings.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
        setAvgRating((sum / ratings.length).toFixed(1));
        setRatingCount(ratings.length);
      }

      setLoading(false);
    }).catch(err => {
      console.error("Dashboard fetch error:", err);
      setLoading(false);
    });

    // Fetch notifications unread count
    fetch(`/api/notifications?user_id=${doctorId}&role=doctor`)
      .then(r => r.json())
      .then(data => {
        const count = data.unread_count ?? 0;
        const local = JSON.parse(localStorage.getItem('local_notifications') || '[]');
        const localUnread = local.filter((n: any) => !n.is_read).length;
        setUnreadCount(count + localUnread);
      })
      .catch(() => { });
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [doctorId, fetchAll]);

  useEffect(() => {
    const onFocus = () => { if (doctorId) fetchAll(); };
    window.addEventListener("focus", onFocus);
    const handleVisibility = () => {
      if (!document.hidden && doctorId) fetchAll();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [doctorId, fetchAll]);

  // Socket listener for new notifications + appointment cancellations
  useEffect(() => {
    const socket = getSocket();
    const handleNew = () => setUnreadCount(c => c + 1);
    const handleCancelled = () => { if (doctorId) fetchAll(); };
    const handleLocal = () => setUnreadCount(c => c + 1);

    const handleNewNotif = (data: any) => {
      handleNew();
      const msg = data?.message || data?.description || data?.text;
      if (msg) {
        window.alert(`🔔 Notification: ${data.title || 'Update'}\n\n${msg}`);
      }
      fetchAll();
    };

    socket.on('new_notification', handleNewNotif);
    socket.on('medication_reminder', handleNew);
    socket.on('appointment_cancelled', handleCancelled);
    socket.on('appointment_reassigned', handleNewNotif);
    socket.on('rating_updated', handleCancelled);
    window.addEventListener('new_notification_local', handleLocal);
    window.addEventListener('appointment-cancelled', handleCancelled);
    window.addEventListener('rating-updated', handleCancelled);

    return () => {
      socket.off('new_notification', handleNewNotif);
      socket.off('medication_reminder', handleNew);
      socket.off('appointment_cancelled', handleCancelled);
      socket.off('appointment_reassigned', handleCancelled);
      socket.off('rating_updated', handleCancelled);
      window.removeEventListener('new_notification_local', handleLocal);
      window.removeEventListener('appointment-cancelled', handleCancelled);
      window.removeEventListener('rating-updated', handleCancelled);
    };
  }, [doctorId, fetchAll]);

  const getGreeting = (): string => {
    if (dashStats?.greeting) return `${dashStats.greeting},`;
    const h = new Date().getHours();
    if (h < 12) return "Good Morning,";
    if (h < 17) return "Good Afternoon,";
    return "Good Evening,";
  };

  const patientsToday = todayAppts.length;
  const pendingToday = todayAppts.filter(
    a => a.status === "Scheduled" && a.consultation_status !== "Completed"
  ).length;

  const getMinutesUntil = (timeStr: string, dateStr: string): number => {
    if (!timeStr || !dateStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    const [y, mon, d] = dateStr.split("-").map(Number);
    const now = new Date();
    const target = new Date(y, mon - 1, d, h, m, 0, 0);
    return Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
  };

  const nextAppt = upcomingAppts[0] ?? null;
  const scheduledToday = todayAppts.filter(a => a.status === "Scheduled");
  const schedulePreview = scheduledToday.slice(0, 3);

  const stats = [
    { label: 'Patients Today', value: patientsToday, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pending', value: pendingToday, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100' },
    { label: 'Rating', value: `${avgRating}`, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Earnings', value: `₹${earnings.toLocaleString()}`, icon: IndianRupee, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const handleStartConsultation = (apt: any) => {
    if (!apt) return;
    navigate(`/doctor-consultation/${apt.id}`, {
      state: {
        appointmentId: apt.id,
        patientId: apt.patient_id,
        patientName: apt.patient_name,
        date: apt.date,
        time: apt.time,
      }
    });
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Synchronizing Your Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* HEADER SECTION */}
        <header className="bg-white rounded-[2rem] border border-gray-100 shadow-soft p-6 flex justify-between items-center transition-all hover:shadow-md">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-primary/10 shadow-inner bg-gray-50 transition-transform group-hover:scale-105 duration-300">
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                    {displayName.slice(0, 2).toUpperCase() || "DR"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{getGreeting()}</p>
              <h1 className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                Dr. {displayName.split(' ')[0] || " Sarah"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md active:scale-95 group">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest leading-none">Status: Active</span>
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:shadow-md transition-all active:scale-90 relative"
            >
              <Bell size={24} strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* STATS CARDS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((card, idx) => (
            <Card key={idx} className="p-6 border-none shadow-soft hover:shadow-md transition-all group relative bg-white overflow-hidden">
              <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-black/5`}>
                <card.icon size={24} className={card.color} strokeWidth={2.5} />
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-1.5 tracking-tighter leading-none">{card.value}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{card.label}</p>
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${card.bg} opacity-20 rounded-full blur-3xl`}></div>
            </Card>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          <div className="lg:col-span-2 space-y-8">

            {/* NEXT APPOINTMENT CARD */}
            <Card className="p-0 overflow-hidden border-none shadow-soft bg-white rounded-[2.5rem]">
              {nextAppt ? (
                <>
                  <div className="p-8 pb-3 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3 leading-none opacity-60">Next Appointment</p>
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2 group-hover:text-primary transition-colors">
                        {nextAppt.patient_name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Medical Consultation</p>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <p className="text-xs font-black text-primary uppercase tracking-widest">General Health</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-primary tracking-tighter leading-none">
                        {nextAppt.time}
                      </p>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-2 tracking-widest flex items-center justify-end gap-1">
                        <span className="animate-pulse w-2 h-2 bg-primary rounded-full"></span>
                        IN {getMinutesUntil(nextAppt.time, nextAppt.date)} MINS
                      </p>
                    </div>
                  </div>
                  <div className="p-8 pt-5">
                    <button
                      onClick={() => handleStartConsultation(nextAppt)}
                      className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                      <Video size={18} fill="currentColor" fillOpacity={0.3} />
                      Begin Live Session
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                    <CheckCircle className="text-gray-200" size={32} />
                  </div>
                  <p className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Your schedule is clear</p>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No more upcoming consultations for today.</p>
                </div>
              )}
            </Card>

            {/* TODAY'S SCHEDULE LIST */}
            <div className="space-y-6">
              <div className="flex justify-between items-end px-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Schedule Preview</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">Your prioritized upcoming visits</p>
                </div>
                {scheduledToday.length > 0 && (
                  <button
                    onClick={() => navigate('/doctor-today-appointments')}
                    className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary transition-all text-primary hover:text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    View Timeline
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {schedulePreview.length > 0 ? schedulePreview.map((apt) => (
                  <Card key={apt.id} className="p-5 border-none shadow-soft hover:shadow-md transition-all flex items-center gap-6 bg-white rounded-3xl group">
                    <div className="w-20 text-center border-r border-gray-100 pr-6 group-hover:border-primary/20 transition-colors">
                      <p className="text-lg font-black text-primary mb-0.5 leading-none">{apt.time}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Pending</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-gray-900 truncate tracking-tight group-hover:text-primary transition-colors">{apt.patient_name}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 opacity-60">General Consultation</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest leading-none">{apt.status}</span>
                    </div>
                  </Card>
                )) : (
                  <div className="p-20 text-center bg-white rounded-[2.5rem] shadow-soft border-2 border-dashed border-gray-100/30">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 shadow-inner">
                      <CheckCircle className="text-green-400" size={40} />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs">Timeline Synchronized</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">No scheduled visits in your current queue.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase px-4 leading-none">Shortcuts</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Consultations', icon: Video, color: 'bg-blue-500', path: '/doctor-appointments', isConsultation: true },
                { label: 'Appointments', icon: Calendar, color: 'bg-teal-500', path: '/doctor-appointments' },
                { label: 'Slot Availability', icon: Clock, color: 'bg-orange-500', path: '/doctor-slot-availability' },
                { label: 'Review Reports', icon: Activity, color: 'bg-primary', path: '/doctor-review-reports' },
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (action.isConsultation) {
                      if (nextAppt) {
                        handleStartConsultation(nextAppt);
                      } else {
                        alert("No upcoming consultations scheduled for today.");
                      }
                    } else {
                      navigate(action.path);
                    }
                  }}
                  className="bg-white p-7 rounded-[2rem] shadow-soft border border-gray-100/50 flex flex-col items-center gap-5 hover:shadow-xl hover:bg-gray-50/50 transition-all group active:scale-[0.98]"
                >
                  <div className={`w-14 h-14 ${action.color} rounded-[1.25rem] flex items-center justify-center text-white shadow-lg group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}>
                    {<action.icon size={26} strokeWidth={2.5} />}
                  </div>
                  <span className="text-[11px] font-black text-gray-800 text-center uppercase tracking-tight leading-none group-hover:text-primary transition-colors">{action.label}</span>
                </button>
              ))}
              {/* Activity indicator moved to helper */}
              <div className="col-span-2 bg-gradient-to-br from-primary to-blue-700 p-6 rounded-[2rem] shadow-lg shadow-primary/20 text-white relative overflow-hidden group transition-all hover:scale-[1.02]">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Personal Performance</p>
                  <h4 className="text-lg font-black mt-2 leading-tight">
                    {dashStats.completed > 0
                      ? `You've helped ${dashStats.completed} patients achieve better health!`
                      : "Start your journey today! Patients are waiting for your expertise."}
                  </h4>
                  <div className="flex gap-4 mt-4">
                    <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <p className="text-[8px] font-black uppercase opacity-60">Total Sessions</p>
                      <p className="text-sm font-black">{dashStats.total ?? 0}</p>
                    </div>
                    <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <p className="text-[8px] font-black uppercase opacity-60">Avg Rating</p>
                      <p className="text-sm font-black">{avgRating} ⭐ ({ratingCount})</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const Activity = ({ size, strokeWidth, className }: any) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
