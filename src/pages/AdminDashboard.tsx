import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiDelete } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import socket from '../services/socketService';
import {
  Users,
  UserPlus,
  Calendar,
  DollarSign,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Bell,
  Trash2,
  CreditCard,
  Settings } from
'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [activeTab, setActiveTab] = useState<'doctors' | 'patients' | 'appointments' | 'payments'>('doctors');
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Dynamic Dashboard Data
  const [stats, setStats] = useState<any>({
    total_patients: 0,
    total_revenue: '0',
    active_doctors: 0,
    today_appointments: 0
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  // const [notifications, setNotifications] = useState<any[]>([]); // Using context
  // const [unreadCount, setUnreadCount] = useState(0); // Using context
  const [errorStates, setErrorStates] = useState<any>({
    stats: false,
    graphs: false,
    pending: false,
    tab: false
  });

  const adminId = localStorage.getItem("user_id");

  const reloadStats = useCallback(async () => {
    try {
      const data = await apiGet('/api/admin/platform-stats', { role: 'admin' });
      if (data) {
        setStats({
          total_patients: data.patients ?? 0,
          active_doctors: data.doctors ?? 0,
          today_appointments: data.appointments ?? 0,
          total_revenue: data.revenue ? `₹${(data.revenue/100000).toFixed(1)}L` : '0'
        });
        setErrorStates((prev: any) => ({ ...prev, stats: false }));
      }
    } catch (e) {
      console.error("Stats load failed", e);
      setErrorStates((prev: any) => ({ ...prev, stats: true }));
    }
  }, [adminId]);

  const reloadGraphs = useCallback(async () => {
    try {
      const revData = await apiGet('/api/admin/revenue-trend', { role: 'admin' });
      if (revData && revData.months) {
        setRevenueData(revData.months.map((m: string, i: number) => ({ month: m, revenue: revData.revenue[i] })));
      }

      const aptData = await apiGet('/api/admin/appointments-weekly', { role: 'admin' });
      if (aptData && aptData.days) {
        setAppointmentsData(aptData.days.map((d: string, i: number) => ({ day: d, appointments: aptData.appointments[i] })));
      }
      setErrorStates((prev: any) => ({ ...prev, graphs: false }));
    } catch (e) {
      console.error("Graphs load failed", e);
      setErrorStates((prev: any) => ({ ...prev, graphs: true }));
    }
  }, []);

  const reloadPending = useCallback(async () => {
    try {
      const data = await apiGet('/api/admin/doctors/pending', { role: 'admin' });
      setPendingCount(data?.count ?? (Array.isArray(data) ? data.length : 0));
      setErrorStates((prev: any) => ({ ...prev, pending: false }));
    } catch (e) {
      console.error("Pending load failed", e);
      setErrorStates((prev: any) => ({ ...prev, pending: true }));
    }
  }, []);

  const reloadTabData = useCallback(async () => {
    try {
      let data;
      if (activeTab === 'doctors') data = await apiGet('/api/admin/doctors', { role: 'admin' });
      else if (activeTab === 'patients') data = await apiGet('/api/admin/users', { role: 'admin' });
      else if (activeTab === 'appointments') data = await apiGet('/api/admin/appointments', { role: 'admin' });
      else if (activeTab === 'payments') data = await apiGet('/api/admin/payments', { role: 'admin' });

      if (Array.isArray(data)) {
        if (activeTab === 'doctors') setDoctors(data);
        else if (activeTab === 'patients') setPatients(data);
        else if (activeTab === 'appointments') setAppointments(data);
        else if (activeTab === 'payments') setPayments(data);
      }
      setErrorStates((prev: any) => ({ ...prev, tab: false }));
    } catch (e) {
      console.error("Tab data load failed", e);
      setErrorStates((prev: any) => ({ ...prev, tab: true }));
    }
  }, [activeTab, adminId]);

  // reloadNotifications moved to context

  // handleMarkRead moved to context

  const loadProfile = async () => {
    try {
      const profile = await apiGet('/api/profile', { user_id: adminId, role: 'admin' });
      if (profile?.full_name) setAdminName(profile.full_name);
    } catch (e) {
      console.error("Profile load failed", e);
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!window.confirm("Delete this doctor?")) return;
    try {
      await apiDelete(`/api/admin/doctor/delete/${id}`, { role: 'admin' });
      reloadTabData();
    } catch (e) {
      alert("Failed to delete doctor");
    }
  };

  const handleDeletePatient = async (id: number) => {
    if (!window.confirm("Delete this patient?")) return;
    try {
      await apiDelete(`/api/admin/user/delete/${id}`, { role: 'admin' });
      reloadTabData();
    } catch (e) {
      alert("Failed to delete patient");
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate('/login');
      return;
    }

    loadProfile();
    reloadStats();
    reloadGraphs();
    reloadPending();
    // reloadNotifications(); // Handled by context

    const statsInterval = setInterval(reloadStats, 15000);
    const pendingInterval = setInterval(reloadPending, 20000);

    // Socket Setup
    if (socket) {
      socket.emit("admin_join_dashboard", { role: "admin" });

      const handleDashboardUpdate = () => {
        reloadStats();
        reloadGraphs();
        reloadPending();
        // reloadNotifications(); // Handled by context
        reloadTabData();
      };

      socket.on("dashboard_update", handleDashboardUpdate);
      socket.on("new_appointment", handleDashboardUpdate);
      socket.on("consultation_started", handleDashboardUpdate);
      socket.on("consultation_ended", handleDashboardUpdate);

      return () => {
        clearInterval(statsInterval);
        clearInterval(pendingInterval);
        socket.off("dashboard_update", handleDashboardUpdate);
        socket.off("new_appointment", handleDashboardUpdate);
        socket.off("consultation_started", handleDashboardUpdate);
        socket.off("consultation_ended", handleDashboardUpdate);
      };
    }

    return () => {
      clearInterval(statsInterval);
      clearInterval(pendingInterval);
    };
  }, [navigate, reloadStats, reloadPending, reloadGraphs, reloadTabData]);

  useEffect(() => {
    reloadTabData();
  }, [reloadTabData]);

  return (
    <ScreenContainer className="bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">
              Overview
            </p>
            <h1 id="dashboardUserName" className="text-3xl font-bold text-gray-900">
              {adminName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 text-gray-600 relative hover:bg-white transition-colors">

                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Static Notifications Panel */}
              {showNotifications && (
                <Card className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto z-50 shadow-2xl animate-fade-in divide-y divide-gray-100 p-0 border border-gray-100">
                  <div className="p-4 bg-white sticky top-0 flex justify-between items-center z-10 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
                  </div>
                  <div className="bg-white">
                    {notifications.length > 0 ? notifications.map((n: any) => (
                      <div 
                        key={n.id} 
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className={`p-4 flex gap-3 cursor-pointer ${!n.is_read ? 'bg-blue-50/20' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Bell size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'} line-clamp-1`}>{n.title}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-gray-400 text-xs">No notifications available</div>
                    )}
                  </div>
                </Card>
              )}
            </div>
            
            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 text-gray-600 transition-colors hover:bg-white">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users size={24} className="text-[#1E88E5]" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              {errorStates.stats ? "No data available" : stats.total_patients.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Total Patients</p>
          </Card>

          <Card className="p-5 border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign size={24} className="text-[#43A047]" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              {errorStates.stats ? "No data available" : stats.total_revenue}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Total Revenue</p>
          </Card>

          <Card className="p-5 border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <UserPlus size={24} className="text-[#26A69A]" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              {errorStates.stats ? "No data available" : stats.active_doctors}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Active Doctors</p>
          </Card>

          <Card className="p-5 border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Calendar size={24} className="text-purple-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              {errorStates.stats ? "No data available" : stats.today_appointments}
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Appointments</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Graph */}
          <Card className="p-5 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
              <span className="text-sm text-gray-500">Last 5 months</span>
            </div>
            <div className="h-64">
              {errorStates.graphs ? (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#757575'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#757575'}} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} 
                      formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#1E88E5" strokeWidth={3} dot={{fill: '#1E88E5', r: 4}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Appointments Overview Graph */}
          <Card className="p-5 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Appointments Overview</h3>
              <span className="text-sm text-gray-500">This week</span>
            </div>
            <div className="h-64">
              {errorStates.graphs ? (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#757575'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#757575'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                      cursor={{fill: '#f5f5f5'}}
                    />
                    <Bar dataKey="appointments" fill="#26A69A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card className="p-5 border-l-4 border-l-[#FB8C00] flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/doctor-approvals')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <AlertCircle size={24} className="text-[#FB8C00]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pending Approvals</h3>
              <p className="text-sm text-gray-500">
                {errorStates.pending ? "No data available" : `${pendingCount} doctors waiting for review`}
              </p>
            </div>
          </div>
          <ChevronRight size={24} className="text-gray-400" />
        </Card>

        {/* Management Tabs */}
        <div>
          <div className="flex p-1 bg-gray-100 rounded-xl mb-6 max-w-lg overflow-x-auto">
            {(['doctors', 'patients', 'appointments', 'payments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] py-3 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-white text-[#1E88E5] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {errorStates.tab ? (
              <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">No data available</div>
            ) : (
              <>
                {activeTab === 'doctors' && doctors.map((doc: any) => (
                  <Card key={doc.id} className="flex items-center justify-between p-5 border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center font-bold text-[#1E88E5] text-lg">
                        {doc.full_name?.split(' ').map((n: any) => n[0]).join('') || doc.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900">{doc.full_name || doc.name}</h3>
                        <p className="text-sm text-gray-500">{doc.specialization} • {doc.experience_years}y Exp</p>
                        <p className="text-xs text-gray-400 mt-1">Fee: ₹{doc.fee} • {doc.languages}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleDeleteDoctor(doc.id)}
                        className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </Card>
                ))}

                {activeTab === 'patients' && patients.map((patient: any) => (
                  <Card key={patient.id} className="flex items-center justify-between p-5 border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center font-bold text-[#26A69A] text-lg">
                        {patient.name?.split(' ').map((n: any) => n[0]).join('') || patient.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                        <p className="text-xs text-primary font-bold mt-1">Wallet: ₹{patient.wallet_balance}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleDeletePatient(patient.id)}
                        className="p-2 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  </Card>
                ))}

                {activeTab === 'appointments' && appointments.map((apt: any) => (
                  <Card key={apt.id} className="p-5 border border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-base text-gray-900">ID: #{apt.id}</h3>
                      <p className="text-sm text-gray-500">Patient ID: {apt.patient_id} • Doctor ID: {apt.doctor_id}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {apt.date}</span>
                      </div>
                    </div>
                    <Badge variant={apt.status === 'Completed' ? 'success' : apt.status === 'Pending' ? 'warning' : 'info'}>
                      {apt.status}
                    </Badge>
                  </Card>
                ))}

                {activeTab === 'payments' && payments.map((pay: any) => (
                  <Card key={pay.id} className="p-5 border border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900">₹{pay.amount}</h3>
                        <p className="text-sm text-gray-500">Patient ID: {pay.patient_id} • {pay.date}</p>
                      </div>
                    </div>
                    <Badge variant={pay.status === 'Success' ? 'success' : 'warning'}>
                      {pay.status}
                    </Badge>
                  </Card>
                ))}

                {((activeTab === 'doctors' && doctors.length === 0) || 
                  (activeTab === 'patients' && patients.length === 0) || 
                  (activeTab === 'appointments' && appointments.length === 0) ||
                  (activeTab === 'payments' && payments.length === 0)) && (
                  <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">No data available</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}