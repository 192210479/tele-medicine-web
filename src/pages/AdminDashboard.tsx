import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socketUtils';
import {
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  AlertCircle,
  Bell,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type Stats = {
  patients: number;
  revenue: number;
  active_doctors: number;
  today_appointments: number;
};

type TrendPoint = { month: string; revenue: number };
type WeekPoint = { day: string; count: number };

type DoctorRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  specialization: string;
  experience: number;
  fee: number;
  status: string;
  profile_image: string | null;
  license_number: string;
  created_at: string | null;
  total_appointments: number;
  today_appointments: number;
  last_appointment: string | null;
};

type PatientRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string;
  address: string;
  profile_image: string | null;
  registered_at: string | null;
  last_appointment: string | null;
  last_doctor_name: string | null;
  total_appointments: number;
  status: string;
};

type ApptRow = {
  id: number;
  patient_name: string;
  doctor_name: string;
  specialization: string | null;
  date: string;
  time: string;
  status: string;
};

type TicketRow = {
  id: number;
  user_id: number;
  role: string;
  issue_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string | null;
  user_name?: string;
  resolution_note?: string;
};

type TabKey = "Doctors" | "Patients" | "Appointments" | "Support";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { userId: authUserId } = useAuth();
  const adminId = authUserId ?? Number(localStorage.getItem("user_id"));

  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [weekly, setWeekly] = useState<WeekPoint[]>([]);

  const [activeTab, setTab] = useState<TabKey>("Doctors");
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [appointments, setAppointments] = useState<ApptRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Support Ticket Management
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const fetchStats = useCallback(() => {
    fetch("/api/admin/dashboard-stats?role=admin")
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);

    // Fetch unread count
    fetch(`/api/notifications?user_id=${adminId}&role=admin`)
      .then(r => r.json())
      .then(data => setUnreadCount(data.unread_count ?? 0))
      .catch(() => { });
  }, [adminId]);

  const fetchCharts = useCallback(() => {
    fetch("/api/admin/revenue_trend")
      .then(r => r.json())
      .then((data: TrendPoint[]) => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (Array.isArray(data) && data.length > 0) {
          const fixed = data.map((item, idx) => {
            const lastMonthName = data[data.length - 1].month;
            let lastIdx = monthNames.indexOf(lastMonthName);
            if (lastIdx === -1) lastIdx = new Date().getMonth();
            const correctMonth = monthNames[(lastIdx - (data.length - 1 - idx) + 12) % 12];
            return { ...item, month: correctMonth };
          });
          setTrend(fixed);
        } else {
          setTrend(data || []);
        }
      })
      .catch(console.error);

    fetch("/api/admin/weekly_appointments")
      .then(r => r.json())
      .then((data: WeekPoint[]) => {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        if (Array.isArray(data)) {
          const fixed = data.map((item, idx) => ({
            ...item,
            day: dayNames[idx % 7]
          }));
          setWeekly(fixed);
        } else {
          setWeekly([]);
        }
      })
      .catch(console.error);
  }, []);

  const fetchTabData = useCallback((tab: TabKey) => {
    setTabLoading(true);
    const urls: Record<TabKey, string> = {
      Doctors: "/api/admin/doctors/all?role=admin",
      Patients: "/api/admin/patients/all?role=admin",
      Appointments: "/api/admin/appointments_list",
      Support: "/api/admin/support/tickets",
    };
    fetch(urls[tab])
      .then(r => r.json())
      .then(data => {
        if (tab === "Doctors") setDoctors(Array.isArray(data) ? data : []);
        if (tab === "Patients") setPatients(Array.isArray(data) ? data : []);
        if (tab === "Appointments") setAppointments(Array.isArray(data) ? data : []);
        if (tab === "Support") setTickets(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setTabLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCharts();
    // Pre-fetch doctors and patients for name mapping in Support
    fetch("/api/admin/doctors/all?role=admin").then(r => r.json()).then(setDoctors).catch(() => { });
    fetch("/api/admin/patients/all?role=admin").then(r => r.json()).then(setPatients).catch(() => { });
  }, [fetchStats, fetchCharts]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  // Socket listener for admin notifications + real-time cancellations
  useEffect(() => {
    const socket = getSocket();
    const handleNew = () => setUnreadCount(c => c + 1);
    const handleCancelled = () => {
      fetchStats();
      fetchTabData(activeTab);
    };

    socket.on('new_notification', handleNew);
    socket.on('appointment_cancelled', handleCancelled);
    window.addEventListener('appointment-cancelled', handleCancelled);

    // Also join admin_dashboard room for stats updates if needed
    socket.emit('admin_join_dashboard', { role: 'admin' });

    return () => {
      socket.off('new_notification', handleNew);
      socket.off('appointment_cancelled', handleCancelled);
      window.removeEventListener('appointment-cancelled', handleCancelled);
    };
  }, [activeTab, fetchStats, fetchTabData]);

  const fmtRevenue = (n: number): string => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

  const getPatientGrowth = () => {
    if (!patients || patients.length === 0) return 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentPeriod = patients.filter(p => p.registered_at && new Date(p.registered_at) >= thirtyDaysAgo).length;
    const prevPeriod = patients.filter(p => p.registered_at && new Date(p.registered_at) >= sixtyDaysAgo && new Date(p.registered_at) < thirtyDaysAgo).length;

    if (prevPeriod === 0) return currentPeriod > 0 ? 100 : 0;
    return Math.round(((currentPeriod - prevPeriod) / prevPeriod) * 100);
  };

  const getRevenueGrowth = () => {
    if (!trend || trend.length < 2) return 0;
    const last = trend[trend.length - 1].revenue;
    const prev = trend[trend.length - 2].revenue;
    if (prev === 0) return last > 0 ? 100 : 0;
    return Math.round(((last - prev) / prev) * 100);
  };

  const Av = ({ img, name, color = "blue" }: {
    img: string | null; name: string; color?: string
  }) => {
    const avatarUrl = img ? (img.startsWith('/api/') || img.startsWith('http') ? img : `/api/profile/image/file/${img}`) : null;
    return avatarUrl ? (
      <img src={avatarUrl} alt={name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100 shadow-sm"
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
    ) : (
      <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center
                       justify-center text-${color}-700 font-bold flex-shrink-0 border border-${color}-50`}>
        {name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
      </div>
    );
  };

  const getReporterName = (t: TicketRow) => {
    if (t.user_name && t.user_name !== "Unknown User" && t.user_name !== "Unknown") return t.user_name;
    const found = t.role === 'doctor'
      ? doctors.find(d => d.id === t.user_id)?.name
      : patients.find(p => p.id === t.user_id)?.full_name;
    return found || `User #${t.user_id}`;
  };

  const handleUpdateStatus = async (ticketId: number, newStatus: string, note?: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    setIsResolving(true);
    try {
      // 1. Persist to backend
      await fetch('/api/admin/support/tickets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          status: newStatus,
          resolution_note: note || (newStatus === 'Escalated' ? 'Issue has been escalated for further review.' : undefined)
        })
      });

      // 2. Emit real-time notification via socket
      const socket = getSocket();
      socket.emit('new_notification', {
        user_id: ticket.user_id,
        role: ticket.role,
        type: 'support',
        title: `Issue ${newStatus}`,
        description: note || `Your support ticket regarding "${ticket.title}" is now ${newStatus.toLowerCase()}.`,
        created_at: new Date().toISOString()
      });

      // 3. Update local state
      setTickets(prev => prev.map(t =>
        t.id === ticketId ? { ...t, status: newStatus, resolution_note: note || t.resolution_note } : t
      ));

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
        setResolutionNote("");
      }
    } catch (err) {
      console.error("Failed to update ticket status:", err);
    } finally {
      setIsResolving(false);
    }
  };

  const StatusBadge = ({ s }: { s: string }) => {
    const map: Record<string, string> = {
      Approved: "bg-green-100 text-green-700",
      Active: "bg-green-100 text-green-700",
      Scheduled: "bg-blue-100 text-blue-700",
      Completed: "bg-green-100 text-green-700",
      Pending: "bg-orange-100 text-orange-600",
      Cancelled: "bg-red-100 text-red-600",
      Missed: "bg-gray-100 text-gray-500",
      Rejected: "bg-red-100 text-red-600",
      Inactive: "bg-gray-100 text-gray-500",
      Open: "bg-blue-100 text-blue-700",
      Escalated: "bg-red-100 text-red-700",
      Closed: "bg-gray-100 text-gray-600",
      Resolved: "bg-green-100 text-green-700",
    };
    const displayS = (s === "Payment Pending" || s === "Pending") ? "Scheduled" : s;
    const style = map[displayS] ?? map[s] ?? "bg-gray-100 text-gray-600";

    return (
      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full
                        ${style}`}>
        {displayS}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ScreenContainer className="pb-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">System Overview</p>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-md transition-all relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center
                               justify-center text-gray-600 hover:bg-gray-200">
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl shadow-inner group-hover:scale-110 transition-transform">👥</div>
                {(() => {
                  const growth = getPatientGrowth();
                  return (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${growth >= 0 ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                      {growth >= 0 ? `+${growth}%` : `${growth}%`}
                    </span>
                  );
                })()}
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none">{stats?.patients?.toLocaleString() ?? "—"}</p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Total Patients</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 text-2xl shadow-inner group-hover:scale-110 transition-transform">₹</div>
                {(() => {
                  const growth = getRevenueGrowth();
                  return (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${growth >= 0 ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                      {growth >= 0 ? `+${growth}%` : `${growth}%`}
                    </span>
                  );
                })()}
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none">{fmtRevenue(stats?.revenue ?? 0)}</p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Total Revenue</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 text-2xl shadow-inner group-hover:scale-110 transition-transform">🩺</div>
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none">{stats?.active_doctors ?? "—"}</p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Active Doctors</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 text-2xl shadow-inner group-hover:scale-110 transition-transform">📅</div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 uppercase tracking-widest border border-blue-100">Today</span>
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none">{stats?.today_appointments ?? "—"}</p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Appointments</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-none shadow-soft p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none">Revenue Trend</h3>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Last 5 months</p>
                </div>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                      tickFormatter={v => v >= 1000 ? `₹${v / 1000}k` : `₹${v}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(v: number) => [fmtRevenue(v), "Revenue"]}
                    />
                    <Line
                      type="monotone" dataKey="revenue"
                      stroke="#3B82F6" strokeWidth={4}
                      dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-white border-none shadow-soft p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none">Appointments Overview</h3>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">This week</p>
                </div>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Management Section */}
          <div className="space-y-6">
            <div className="flex bg-gray-200/50 backdrop-blur-sm rounded-2xl p-1.5 gap-1.5 shadow-inner overflow-x-auto">
              {(["Doctors", "Patients", "Appointments", "Support"] as TabKey[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTab(tab)}
                  className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-200 ${activeTab === tab
                    ? "bg-white text-primary shadow-md transform scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {tabLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-soft">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Synchronizing Data...</p>
                </div>
              ) : activeTab === "Doctors" ? (
                doctors.length === 0 ? <p className="text-center text-gray-400 py-12 bg-white rounded-3xl shadow-soft font-bold">No doctors found.</p>
                  : doctors.map(d => (
                    <div key={d.id} className="bg-white rounded-2xl border border-gray-50 shadow-soft p-4 flex items-center gap-4 hover:shadow-md transition-all group">
                      <Av img={d.profile_image} name={d.name} color="blue" />
                      <div className="flex-1">
                        <p className="font-black text-gray-800 text-base leading-none group-hover:text-primary transition-colors">{d.name}</p>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                          {d.specialization ?? "General"} &middot; {d.total_appointments} Consultation{d.total_appointments !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <StatusBadge s={d.status === "Approved" ? "Active" : d.status} />
                      <button className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  ))
              ) : activeTab === "Patients" ? (
                patients.length === 0 ? <p className="text-center text-gray-400 py-12 bg-white rounded-3xl shadow-soft font-bold">No patients found.</p>
                  : patients.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-50 shadow-soft p-4 flex items-center gap-4 hover:shadow-md transition-all group">
                      <Av img={p.profile_image} name={p.full_name} color="teal" />
                      <div className="flex-1">
                        <p className="font-black text-gray-800 text-base leading-none group-hover:text-primary transition-colors">{p.full_name}</p>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                          {p.age ? `Age: ${p.age}` : "Age: N/A"}
                          {p.last_appointment ? ` &middot; Last: ${new Date(p.last_appointment + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}` : " &middot; New Patient"}
                        </p>
                      </div>
                      <StatusBadge s={p.status} />
                      <button className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  ))
              ) : activeTab === "Appointments" ? (
                <>
                  <div className="flex justify-between items-center mb-4 px-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Recent Schedule</p>
                    {appointments.length > 0 && (
                      <button
                        onClick={() => navigate('/admin-appointments')}
                        className="text-[10px] font-black text-primary hover:text-primary-dark uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg transition-all"
                      >
                        View All →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appointments.length === 0 ? (
                      <p className="col-span-full text-center text-gray-400 py-12 bg-white rounded-3xl shadow-soft font-bold">No appointments found.</p>
                    ) : (
                      appointments.slice(0, 4).map(a => (
                        <div key={a.id} className="bg-white rounded-[2rem] border border-gray-50 shadow-soft p-5 group hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Av img={doctorMap[a.id]?.image} name={a.doctor_name} />
                              <div>
                                <p className="font-black text-gray-800 text-sm leading-none group-hover:text-primary transition-colors line-clamp-1">{a.patient_name}</p>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1.5">{a.doctor_name}</p>
                              </div>
                            </div>
                            <StatusBadge s={a.status} />
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-tight">
                              <span>📅 {(() => {
                                const [y, m, d] = a.date.split("-").map(Number);
                                return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
                              })()}</span>
                              <span className="opacity-10 text-lg font-thin">|</span>
                              <span>🕐 {(() => {
                                try {
                                  const [h, m] = a.time.split(":").map(Number);
                                  return `${(h % 12 || 12).toString().padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
                                } catch { return a.time; }
                              })()}</span>
                            </div>
                            <button
                              onClick={() => navigate(`/appointment/${a.id}`)}
                              className="w-8 h-8 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : tickets.length === 0 ? (
                <p className="text-center text-gray-400 py-12 bg-white rounded-3xl shadow-soft font-bold">No support tickets found.</p>
              ) : (
                tickets.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-50 shadow-soft p-5 group hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-gray-800 text-base leading-none group-hover:text-primary transition-colors">{t.title}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-tighter`}>
                            {t.role}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                          REPORTER: <span className="text-gray-600">{getReporterName(t)}</span> &middot; {t.issue_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge s={t.status} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${t.priority === 'High' ? 'text-red-500' : 'text-orange-500'}`}>
                          {t.priority} PRIORITY
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                      <p className="text-gray-600 text-sm font-medium leading-relaxed">{t.description}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant={t.status === 'Resolved' ? 'outline' : 'primary'}
                        onClick={() => setSelectedTicket(t)}
                        className="h-9 px-4 text-xs font-black uppercase tracking-wider"
                      >
                        {t.status === 'Resolved' ? 'View Resolution' : 'Manage Issue'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScreenContainer>

      {/* Ticket Management Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Support Ticket #${selectedTicket?.id}`}
        description="Review user issue and provide a resolution confirmation."
      >
        {selectedTicket && (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reporter</p>
                <p className="text-sm font-bold text-gray-800">
                  {getReporterName(selectedTicket)}
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-bold">{selectedTicket.role}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                <StatusBadge s={selectedTicket.status} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Issue Description</p>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedTicket.description}</p>
              </div>
            </div>

            {selectedTicket.status !== 'Resolved' ? (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Resolution Confirmation</label>
                  <textarea
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-primary min-h-[120px] resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    fullWidth
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Escalated')}
                  >
                    Escalate
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved', resolutionNote)}
                    isLoading={isResolving}
                    disabled={!resolutionNote.trim()}
                  >
                    Resolve & Notify
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Resolution Provided</p>
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <p className="text-sm text-green-800 font-medium leading-relaxed">{selectedTicket.resolution_note || "Issue marked as resolved."}</p>
                </div>
                <Button fullWidth variant="outline" onClick={() => setSelectedTicket(null)}>Close View</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
