import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  Activity,
  ChevronRight,
  Bell,
  AlertTriangle,
  FolderOpen,
  Upload,
  Search,
  Headphones,
  Pill
} from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPut } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export function PatientDashboard() {
  const { user, userId } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  
  // Reminder Alert State
  const [activeReminder, setActiveReminder] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "patient") {
      navigate('/login');
      return;
    }

    if (userId) {
      fetchDashboardData();
      
      const dataInterval = setInterval(fetchDashboardData, 20000);
      
      // Reminder check interval
      const reminderInterval = setInterval(checkMedicines, 30000);
      
      return () => {
        clearInterval(dataInterval);
        clearInterval(reminderInterval);
      };
    }
  }, [userId, navigate]);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

      const isUpcoming = (apt: any) => {
        if (apt.status !== 'Scheduled') return false;
        if (apt.date > todayStr) return true;
        if (apt.date === todayStr && (apt.time || apt.time_slot) >= currentTimeStr) return true;
        return false;
      };

      const [appointmentsData, remindersData] = await Promise.all([
        apiGet('/api/my-appointments', { user_id: userId, role: 'patient' }),
        apiGet('/api/reminders', { user_id: userId })
      ]);

      const upcomingApts = (appointmentsData || []).filter(isUpcoming).sort((a: any, b: any) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || a.time_slot).localeCompare(b.time || b.time_slot);
      });

      const completedApts = (appointmentsData || []).filter((a: any) => 
        a.status === 'Completed' || a.consultation_status === 'Completed'
      );

      setStats({
        total: appointmentsData.length,
        upcoming: upcomingApts.length,
        completed: completedApts.length
      });
      
      if (upcomingApts.length > 0) {
        setNextAppointment(upcomingApts[0]);
      } else {
        setNextAppointment(null);
      }

      setReminders(remindersData || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const checkMedicines = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    reminders.forEach(reminder => {
      if (reminder.status === 'Active' && reminder.reminder_time === currentTime) {
        setActiveReminder(reminder);
      }
    });
  };

  const handleMarkTaken = async () => {
    if (!activeReminder) return;
    try {
      await apiPut(`/api/reminder/complete/${activeReminder.id}`, {
        user_id: userId,
        role: 'patient'
      });
      setActiveReminder(null);
      fetchDashboardData();
    } catch (e) {
      console.error("Failed to mark taken:", e);
    }
  };

  const services = [
    { label: 'Book Appointment', icon: <Calendar className="text-white" size={24} />, color: 'bg-primary', path: '/book-appointment' },
    { label: 'Upcoming', icon: <Clock className="text-white" size={24} />, color: 'bg-secondary', path: '/upcoming-appointments' },
    { label: 'Prescriptions', icon: <FileText className="text-white" size={24} />, color: 'bg-warning', path: '/patient-prescriptions' },
    { label: 'History', icon: <Activity className="text-white" size={24} />, color: 'bg-purple-500', path: '/history' },
    { label: 'Medical Records', icon: <FolderOpen className="text-white" size={24} />, color: 'bg-indigo-500', path: '/medical-records' },
    { label: 'Reminders', icon: <Bell className="text-white" size={24} />, color: 'bg-pink-500', path: '/medication-reminders' }
  ];

  const quickActions = [
    { label: 'Book', icon: Calendar, path: '/book-appointment' },
    { label: 'Upload', icon: Upload, path: '/medical-records' },
    { label: 'Find Doctor', icon: Search, path: '/book-appointment' },
    { label: 'Support', icon: Headphones, path: '/help-support' }
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      day: d.getDate()
    };
  };

  return (
    <ScreenContainer>
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex justify-between items-start">
        <div>
          <p className="text-text-secondary text-sm font-medium">Hello,</p>
          <h1 className="text-2xl font-bold text-text-primary">
            {user?.name || 'Patient'}
          </h1>
        </div>
        <button
          onClick={() => navigate('/notifications')}
          className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 relative hover:bg-gray-50 transition-colors"
        >
          <Bell size={20} className="text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex justify-between items-center text-center">
            <div className="flex-1 border-r border-gray-100">
              <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1">Total</p>
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
            </div>
            <div className="flex-1 border-r border-gray-100">
              <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-secondary">{stats.upcoming}</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            </div>
          </div>

          <Card
            className="bg-red-50 border-red-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate('/emergency-help')}
          >
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-105 transition-transform">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-700">Emergency Help</h3>
              <p className="text-xs text-red-600 font-medium font-bold">
                Call ambulance, contacts & hospitals
              </p>
            </div>
            <ChevronRight size={20} className="text-red-400" />
          </Card>
        </div>

        <div className="flex justify-between sm:justify-start sm:gap-8 bg-white rounded-2xl p-3 shadow-soft border border-gray-50 overflow-x-auto scrollbar-hide">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 p-2 hover:bg-primary/5 rounded-2xl transition-all min-w-[75px]"
            >
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <action.icon size={20} />
              </div>
              <span className="text-[11px] font-bold text-text-secondary">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        <div>
           <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
             <Activity size={20} className="text-primary" />
             Services
           </h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
             {services.map((action, index) => (
               <button
                 key={index}
                 onClick={() => navigate(action.path)}
                 className="bg-white p-5 rounded-[22px] shadow-soft border border-gray-50 flex flex-col items-center justify-center gap-3 hover:translate-y-[-4px] transition-all active:scale-95 group"
               >
                 <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center shadow-lg shadow-${action.color}/20 group-hover:scale-110 transition-transform`}>
                   {action.icon}
                 </div>
                 <span className="font-bold text-sm text-text-primary text-center leading-tight">
                   {action.label}
                 </span>
               </button>
             ))}
           </div>
        </div>

        {/* Next Appointment Card */}
        {nextAppointment ? (
           <Card
              className="flex items-center gap-5 p-5 cursor-pointer hover:border-primary/30 transition-all shadow-premium"
              onClick={() => navigate('/upcoming-appointments')}
            >
              <div className="w-[72px] h-[72px] rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-primary font-bold border-2 border-white shadow-sm">
                <span className="text-xs uppercase whitespace-nowrap tracking-widest">{formatDate(nextAppointment.date).month}</span>
                <span className="text-3xl leading-none mt-1">{formatDate(nextAppointment.date).day}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text-primary text-lg">
                  Dr. {nextAppointment.doctor_name || 'Specialist'}
                </h3>
                <div className="flex items-center gap-1.5 text-text-secondary text-sm mt-1">
                  <Clock size={14} className="text-primary" />
                  <p className="font-medium font-bold">{nextAppointment.time || nextAppointment.time_slot}</p>
                </div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
                  {nextAppointment.specialization || 'Video Consultation'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </Card>
        ) : (
           <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
              <Calendar size={32} className="text-gray-200 mb-2" />
              <p className="text-text-secondary font-medium">No upcoming sessions</p>
           </div>
        )}
      </div>

      {/* Reminder Notification Popup */}
      <Modal
        isOpen={!!activeReminder}
        onClose={() => setActiveReminder(null)}
        title="Medication Reminder"
      >
        <div className="py-6 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border-2 border-blue-100 shadow-lg shadow-blue-50">
             <Pill size={40} className="text-primary animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">Medication Reminder</h2>
            <p className="text-primary font-black text-2xl uppercase tracking-wider">Time to take {activeReminder?.medicine_name}</p>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setActiveReminder(null)} // Locally skip
              className="h-12 border-gray-200 text-gray-500 font-bold rounded-2xl"
            >
              Skip
            </Button>
            <Button
              fullWidth
              onClick={handleMarkTaken}
              className="h-12 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100"
            >
              Mark Taken
            </Button>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}