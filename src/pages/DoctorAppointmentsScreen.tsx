import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Play, Video, ChevronRight, User } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiGet, apiPut, apiPost } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function DoctorAppointmentsScreen() {
  const navigate = useNavigate();
  const { userId, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'Scheduled' | 'Completed' | 'Cancelled'>('Scheduled');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId && role === 'doctor') {
      loadAppointments();
    }
  }, [userId, role, activeTab]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/my-appointments', { 
        user_id: userId, 
        role: 'doctor'
      });

      // 1. CURRENT TIME CALCULATION
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

      const isUpcoming = (apt: any) => {
        if (apt.status !== 'Scheduled') return false;
        if (apt.date > todayStr) return true;
        if (apt.date === todayStr && (apt.time || apt.time_slot) >= currentTimeStr) return true;
        return false;
      };

      const isMissed = (apt: any) => {
        if (apt.status !== 'Scheduled') return false;
        if (apt.date < todayStr) return true;
        if (apt.date === todayStr && (apt.time || apt.time_slot) < currentTimeStr) return true;
        return false;
      };

      let filtered: any[] = [];
      if (activeTab === 'Scheduled') {
        filtered = data.filter(isUpcoming);
      } else if (activeTab === 'Completed') {
        filtered = data.filter((a: any) => a.status === 'Completed' || a.consultation_status === 'Completed' || isMissed(a));
      } else {
        filtered = data.filter((a: any) => a.status === 'Cancelled');
      }

      // Sort by date/time
      filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || a.time_slot).localeCompare(b.time || b.time_slot);
      });

      setAppointments(filtered);
    } catch (error) {
      console.error('Failed to load doctor appointments:', error);
    } finally {
      setIsLoading(false);
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
      console.error("Consultation start failed:", error);
      alert("Error: " + (error instanceof Error ? error.message : "Could not start consultation"));
    }
  };

  const getStatusDisplay = (apt: any) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    if (apt.status === 'Completed' || apt.consultation_status === 'Completed') return 'Completed';
    if (apt.status === 'Cancelled') return 'Cancelled';
    
    if (apt.status === 'Scheduled') {
       if (apt.date < todayStr || (apt.date === todayStr && (apt.time || apt.time_slot) < currentTimeStr)) {
         return 'Missed';
       }
    }
    return apt.status;
  };

  return (
    <ScreenContainer title="My Schedule" showBack className="pb-8 bg-gray-50">
      <div className="px-6 py-4">
        <div className="flex p-1.5 bg-gray-200/50 rounded-2xl mb-8 overflow-x-auto scrollbar-hide backdrop-blur-sm border border-gray-200">
          {(['Scheduled', 'Completed', 'Cancelled'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] py-2.5 px-4 text-sm font-bold rounded-xl capitalize transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-white text-primary shadow-lg shadow-primary/10' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {tab === 'Completed' ? 'History' : tab}
              </button>
            )
          )}
        </div>

        <div className="space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : appointments.length > 0 ? (
            appointments.map((apt) => {
              const status = getStatusDisplay(apt);
              return (
              <Card
                key={apt.id}
                className="p-5 border-none shadow-sm hover:shadow-md transition-all group"
                onClick={() => navigate(`/patient-details?appointment_id=${apt.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary font-bold text-xl border-2 border-white shadow-sm overflow-hidden">
                       {apt.patient_image ? (
                          <img src={apt.patient_image} alt={apt.patient_name} className="w-full h-full object-cover" />
                       ) : (
                          <User size={28} />
                       )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                        {apt.patient_name}
                      </h3>
                      <p className="text-xs text-text-secondary font-bold uppercase tracking-wider flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                         Video Consultation
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      status === 'Scheduled' ? 'info' :
                      status === 'Completed' ? 'success' : 
                      status === 'Missed' ? 'error' : 'neutral'
                    }
                    className="font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded-full"
                  >
                    {status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                      <Calendar size={14} className="text-primary" />
                      {apt.date}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                      <Clock size={14} className="text-primary" />
                      {apt.time || apt.time_slot}
                    </div>
                  </div>
                  
                  {status === 'Scheduled' ? (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartConsultation(apt.id);
                      }}
                      icon={<Play size={14} />}
                      className="font-bold shadow-lg shadow-primary/20 h-10 min-h-0 px-5"
                    >
                      Start
                    </Button>
                  ) : (
                    <div className="flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                      View Details <ChevronRight size={14} className="ml-1" />
                    </div>
                  )}
                </div>
              </Card>
            )})
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Calendar size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                No {activeTab} Appointments
              </h3>
              <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                Any appointments marked as {activeTab.toLowerCase()} will appear here in your schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}