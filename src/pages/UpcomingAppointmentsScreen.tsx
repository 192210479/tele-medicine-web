import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Trash2, ChevronRight, FileText } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { apiGet, apiPut } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socketService';

export function UpcomingAppointmentsScreen() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [consultationStatuses, setConsultationStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    if (userId) {
      loadAppointments();
      const interval = setInterval(loadAppointments, 20000);

      // Socket setup
      let callback1: any;
      let callback2: any;
      if (socket) {
        socket.emit("join_room", "patient_" + userId);
        
        callback1 = (data: any) => {
          if (data.patient_id == userId) {
            setConsultationStatuses(prev => ({ ...prev, [data.appointment_id]: 'Ready' }));
          }
        };

        callback2 = (data: any) => {
          if (data.patient_id == userId) {
            navigate('/patient-video-call', { 
              state: { 
                appointmentId: data.appointment_id,
                sessionId: data.session_id 
              } 
            });
          }
        };

        socket.on("consultation_ready", callback1);
        socket.on("consultation_started", callback2);
      }

      return () => {
        clearInterval(interval);
        if (socket) {
          socket.off("consultation_ready", callback1);
          socket.off("consultation_started", callback2);
        }
      };
    }
  }, [userId]);

  const loadAppointments = async () => {
    try {
      const data = await apiGet('/api/my-appointments', {
        user_id: userId,
        role: 'patient'
      });

      // 1. CURRENT TIME CALCULATION & 2. UPCOMING RULE
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

      const isUpcoming = (apt: any) => {
        if (apt.status !== 'Scheduled') return false;
        if (apt.date > todayStr) return true;
        if (apt.date === todayStr && (apt.time || apt.time_slot) >= currentTimeStr) return true;
        return false;
      };

      const upcoming = data.filter(isUpcoming).sort((a: any, b: any) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || a.time_slot).localeCompare(b.time || b.time_slot);
      });

      setAppointments(upcoming);
      
      upcoming.forEach((apt: any) => {
        if (apt.date === todayStr) {
          checkConsultationStatus(apt.id);
        }
      });
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConsultationStatus = async (appointmentId: number) => {
    try {
      const statusData = await apiGet(`/api/consultation/status/${appointmentId}`, {
        user_id: userId,
        role: 'patient'
      });
      setConsultationStatuses(prev => ({ 
        ...prev, 
        [appointmentId]: statusData.consultation_status 
      }));
    } catch (error) {
      console.error(`Failed to check status for appointment ${appointmentId}:`, error);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await apiPut(`/api/appointment/cancel/${appointmentId}`, {
        user_id: userId,
        role: 'patient'
      });
      alert('Appointment cancelled successfully');
      loadAppointments();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to cancel appointment');
    }
  };

  return (
    <ScreenContainer title="Upcoming Appointments" showBack className="pb-8">
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <Card
                key={apt.id}
                className="hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/patient-details?appointment_id=${apt.id}`)}
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 border-2 border-white shadow-sm overflow-hidden">
                    {apt.doctor_image ? (
                      <img src={apt.doctor_image} alt={apt.doctor_name} className="w-full h-full object-cover" />
                    ) : (
                      apt.doctor_name?.charAt(0) || 'D'
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-text-primary">
                          {apt.doctor_name}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {apt.specialization}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="info">
                           {apt.status}
                        </Badge>
                        {consultationStatuses[apt.id] && (
                          <span className="text-[10px] font-bold uppercase text-primary">
                            {consultationStatuses[apt.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{apt.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{apt.time || apt.time_slot}</span>
                  </div>
                </div>

                <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                        fullWidth
                        icon={<Video size={18} />}
                        onClick={() => navigate('/patient-waiting-room', { 
                          state: { 
                            appointmentId: apt.id,
                            doctorName: apt.doctor_name,
                            specialization: apt.specialization,
                            doctorImage: apt.doctor_image
                          } 
                        })}
                    >
                        {consultationStatuses[apt.id] === 'Ready' || consultationStatuses[apt.id] === 'Live' 
                          ? 'Join Consultation' 
                          : 'Enter Waiting Room'}
                    </Button>
                    <Button
                        variant="ghost"
                        className="bg-red-50 text-red-500 hover:bg-red-100 px-4"
                        onClick={() => handleCancel(apt.id)}
                        title="Cancel Appointment"
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Upcoming Appointments"
            description="You don't have any scheduled appointments. Book a consultation with a doctor to get started."
            actionLabel="Book Appointment"
            onAction={() => navigate('/book-appointment')}
            illustrationType="empty"
          />
        )}
      </div>
    </ScreenContainer>
  );
}