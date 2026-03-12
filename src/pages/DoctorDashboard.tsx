import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  Bell,
  Activity,
  DollarSign,
  Video,
  Play,
  ClipboardList
} from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPut, apiPost } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import socket from '../services/socketService';

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, userId } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [stats, setStats] = useState({ 
    patientsToday: 0, 
    pending: 0, 
    thisWeek: 0, 
    earnings: 0 
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorName, setDoctorName] = useState(user?.name || 'Doctor');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "doctor") {
      navigate('/login');
      return;
    }

    if (userId) {
      loadProfile();
      fetchDashboardData(userId.toString());
    }
  }, [navigate, userId]);

  useEffect(() => {
    if (socket && userId) {
      const handleRefresh = () => {
        fetchDashboardData(userId.toString());
      };

      // 7. REFRESH DOCTOR DASHBOARD - listen for new events
      socket.on('new_appointment', handleRefresh);
      socket.on('new_appointment_created', handleRefresh); // 7. New event for refresh
      socket.on('notification', handleRefresh);
      socket.on('appointment_cancelled', handleRefresh);
      socket.on('status_updated', handleRefresh);

      return () => {
        socket.off('new_appointment', handleRefresh);
        socket.off('new_appointment_created', handleRefresh);
        socket.off('notification', handleRefresh);
        socket.off('appointment_cancelled', handleRefresh);
        socket.off('status_updated', handleRefresh);
      };
    }
  }, [userId]);

  const loadProfile = async () => {
    const uId = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");
    if (!uId || !role) return;

    try {
      const response = await fetch(`http://localhost:5000/api/profile?user_id=${uId}&role=${role}`);
      const profile = await response.json();
      
      if (profile && profile.full_name) {
        setDoctorName(profile.full_name);
      }
    } catch (error) {
      console.error('Failed to fetch profile name:', error);
    }
  };

  const fetchDashboardData = async (doctorId: string) => {
    try {
      // 7. GET /api/my-appointments?role=doctor&user_id={doctorId}
      const data = await apiGet('/api/my-appointments', { 
        user_id: doctorId, 
        role: 'doctor' 
      });

      const sorted = (data || []).sort((a: any, b: any) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        
        const timeA = a.time || a.time_slot || '';
        const timeB = b.time || b.time_slot || '';
        return timeA.localeCompare(timeB);
      });

      setAppointments(sorted);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

      const isUpcoming = (apt: any) => {
        if (apt.status !== 'Scheduled') return false;
        if (apt.date > todayStr) return true;
        if (apt.date === todayStr && (apt.time || apt.time_slot) >= currentTimeStr) return true;
        return false;
      };

      const todayApts = sorted.filter((a: any) => a.date === todayStr && isUpcoming(a));
      const upcomingFiltered = sorted.filter(isUpcoming);
      
      let earnings = 0;
      try {
        const walletData = await apiGet('/api/doctor/wallet', { 
          user_id: doctorId, 
          role: 'doctor' 
        });
        earnings = walletData.balance || walletData.total_earnings || 0;
      } catch (e) {
        console.error("Failed to fetch wallet:", e);
      }

      setStats({
        patientsToday: todayApts.length,
        pending: upcomingFiltered.length,
        thisWeek: sorted.filter(isUpcoming).length,
        earnings: earnings
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleStartConsultation = async (appointmentId: number) => {
    try {
      await apiPut(`/api/consultation/ready/${appointmentId}`, {
        user_id: userId,
        role: 'doctor'
      });

      const response = await apiPost(`/api/consultation/start/${appointmentId}`, {
        user_id: userId,
        role: 'doctor'
      });

      if (response.video_room) {
        navigate(`/doctor-video-call?room=${response.video_room}&appointment=${appointmentId}`);
      } else {
        alert("Failed to start session.");
      }
    } catch (error) {
      console.error('Start consultation failed:', error);
      alert('Could not start consultation. Please try again.');
    }
  };

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  const isUpcoming = (apt: any) => {
    if (apt.status !== 'Scheduled') return false;
    if (apt.date > todayDateStr) return true;
    if (apt.date === todayDateStr && (apt.time || apt.time_slot) >= currentTimeStr) return true;
    return false;
  };

  const nextAppointment = appointments.find(isUpcoming);

  const todaySchedule = appointments
    .filter(a => a.date === todayDateStr && isUpcoming(a))
    .slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'bg-blue-100 text-blue-600';
      case 'waiting': return 'bg-orange-100 text-orange-600';
      case 'pending': return 'bg-gray-100 text-gray-600';
      case 'completed': return 'bg-green-100 text-green-600';
      case 'scheduled': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <ScreenContainer>
      <div className="px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-[30px]">
          
          <div className="lg:w-[70%] space-y-[30px]">
            
            <div className="flex justify-between items-center bg-white p-5 rounded-[12px] shadow-soft border border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-[60px] h-[60px] rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                   <img 
                     src={`http://localhost:5000/uploads/doctors/${userId}.jpg`} 
                     onError={(e: any) => {
                       e.target.onerror = null;
                       e.target.src = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150&h=150";
                     }}
                     alt="Doctor" 
                     className="w-full h-full object-cover" 
                   />
                </div>
                <div>
                  <p className="text-text-secondary text-base font-medium">Hello, Good Morning</p>
                  <h1 className="text-2xl font-bold text-text-primary">
                    Dr. {doctorName}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                  <span className={`text-xs font-bold ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                  <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={`col-10 h-5 rounded-full relative transition-colors ${isOnline ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isOnline ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <button
                  onClick={() => navigate('/notifications')}
                  className="p-3 bg-white rounded-full shadow-sm border border-gray-100 relative hover:bg-gray-50 transition-colors"
                >
                  <Bell size={22} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[20px]">
              <Card className="p-5 bg-white border-none shadow-soft rounded-[12px] flex flex-col gap-1 hover:translate-y-[-2px] transition-transform">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary mb-2">
                  <Users size={20} />
                </div>
                <span className="text-sm font-medium text-gray-500">Patients Today</span>
                <span className="text-2xl font-bold text-text-primary">{stats.patientsToday}</span>
                <span className="text-[10px] text-green-500 font-bold tracking-tight">+ {stats.patientsToday} new</span>
              </Card>
              <Card className="p-5 bg-white border-none shadow-soft rounded-[12px] flex flex-col gap-1 hover:translate-y-[-2px] transition-transform">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 mb-2">
                  <Clock size={20} />
                </div>
                <span className="text-sm font-medium text-gray-500">Pending</span>
                <span className="text-2xl font-bold text-text-primary">{stats.pending}</span>
                <span className="text-[10px] text-orange-500 font-bold tracking-tight">Requires action</span>
              </Card>
              <Card className="p-5 bg-white border-none shadow-soft rounded-[12px] flex flex-col gap-1 hover:translate-y-[-2px] transition-transform">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 mb-2">
                  <Calendar size={20} />
                </div>
                <span className="text-sm font-medium text-gray-500">This Week</span>
                <span className="text-2xl font-bold text-text-primary">{stats.thisWeek}</span>
                <span className="text-[10px] text-purple-500 font-bold tracking-tight">Planned sessions</span>
              </Card>
              <Card className="p-5 bg-white border-none shadow-soft rounded-[12px] flex flex-col gap-1 hover:translate-y-[-2px] transition-transform">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500 mb-2">
                  <DollarSign size={20} />
                </div>
                <span className="text-sm font-medium text-gray-500">Earnings</span>
                <span className="text-2xl font-bold text-text-primary">${stats.earnings}</span>
                <span className="text-[10px] text-green-500 font-bold tracking-tight">+12% vs last week</span>
              </Card>
            </div>

            <div>
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Video size={18} className="text-primary" />
                Next Appointment
              </h2>
              {nextAppointment ? (
                <Card className="p-6 border-none shadow-premium bg-white rounded-[12px] flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-blue-50 flex items-center justify-center text-primary font-bold text-2xl overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                      {nextAppointment.patient_image ? (
                        <img src={nextAppointment.patient_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users size={32} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary text-2xl mb-1">
                        {nextAppointment.patient_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                           <Activity size={14} />
                           {nextAppointment.type || 'Video Consultation'}
                        </span>
                        <div className="flex items-center gap-1.5 text-text-secondary text-sm font-medium">
                          <Calendar size={14} className="text-primary" />
                          {nextAppointment.date}
                        </div>
                        <div className="flex items-center gap-1.5 text-text-secondary text-sm font-medium">
                          <Clock size={14} className="text-primary" />
                          {nextAppointment.time || nextAppointment.time_slot}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleStartConsultation(nextAppointment.id)}
                    className="rounded-[12px] px-8 py-4 h-auto shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                    icon={<Play size={18} fill="currentColor" />}
                  >
                    Start Consultation
                  </Button>
                </Card>
              ) : (
                <div className="bg-white p-12 rounded-[12px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     <Calendar size={32} className="text-gray-200" />
                  </div>
                  <p className="text-text-secondary font-medium">No appointments scheduled today</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-text-primary">Today's Schedule</h2>
                <button 
                  onClick={() => navigate('/doctor-appointments')} 
                  className="text-primary text-sm font-bold hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((apt: any) => (
                    <div key={apt.id} className="p-5 bg-white rounded-[12px] border border-gray-50 flex items-center justify-between shadow-soft hover:shadow-md transition-all hover:translate-x-1">
                      <div className="flex items-center gap-8">
                        <div className="text-sm font-bold text-text-primary min-w-[80px] flex items-center gap-2">
                           <Clock size={14} className="text-primary" />
                           {apt.time || apt.time_slot}
                        </div>
                        <div className="flex items-center gap-4 border-l pl-8 border-gray-100">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold border border-gray-100">
                            {apt.patient_name?.[0] || <Users size={18} />}
                          </div>
                          <div>
                            <h4 className="font-bold text-text-primary">{apt.patient_name}</h4>
                            <p className="text-xs text-primary font-bold uppercase tracking-wider">{apt.type || 'Regular'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${getStatusColor(apt.status)}`}>
                            {apt.status || 'Upcoming'}
                        </span>
                        <button 
                          onClick={() => handleStartConsultation(apt.id)}
                          className="p-2.5 text-primary bg-primary/5 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          <Play size={20} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                   <div className="text-center py-12 bg-white rounded-[12px] border border-gray-50 border-dashed">
                     <p className="text-text-secondary font-medium italic">No more appointments for today</p>
                   </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:w-[30%]">
            <div className="sticky top-6">
              <h2 className="text-lg font-bold text-text-primary mb-5">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-[20px]">
                <button
                  onClick={() => navigate('/doctor-appointments')}
                  className="bg-white p-6 rounded-[12px] shadow-soft border border-gray-50 flex flex-col items-center gap-4 hover:translate-y-[-4px] transition-all active:scale-[0.98] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Video size={24} />
                  </div>
                  <span className="font-bold text-sm text-text-primary text-center leading-tight">
                    Start<br/>Consultation
                  </span>
                </button>
                
                <button
                  onClick={() => navigate('/doctor-appointments')}
                  className="bg-white p-6 rounded-[12px] shadow-soft border border-gray-50 flex flex-col items-center gap-4 hover:translate-y-[-4px] transition-all active:scale-[0.98] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                    <Calendar size={24} />
                  </div>
                  <span className="font-bold text-sm text-text-primary text-center leading-tight">
                    View<br/>Appointments
                  </span>
                </button>

                <button
                  onClick={() => navigate('/doctor-availability')}
                  className="bg-white p-6 rounded-[12px] shadow-soft border border-gray-50 flex flex-col items-center gap-4 hover:translate-y-[-4px] transition-all active:scale-[0.98] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                    <Clock size={24} />
                  </div>
                  <span className="font-bold text-sm text-text-primary text-center leading-tight">
                    Manage<br/>Availability
                  </span>
                </button>

                <button
                  onClick={() => navigate('/medical-records')}
                  className="bg-white p-6 rounded-[12px] shadow-soft border border-gray-50 flex flex-col items-center gap-4 hover:translate-y-[-4px] transition-all active:scale-[0.98] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                    <Activity size={24} />
                  </div>
                  <span className="font-bold text-sm text-text-primary text-center leading-tight">
                    Review<br/>Reports
                  </span>
                </button>
              </div>

              <Card className="mt-[30px] p-6 bg-primary/5 border-none rounded-[12px] shadow-inner">
                <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                  <ClipboardList size={20} />
                  Doctor Tip
                </h3>
                <p className="text-xs text-primary/80 leading-relaxed font-bold">
                  Reviewing patient records before consultation ensures a higher quality of care and more efficient sessions.
                </p>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </ScreenContainer>
  );
}