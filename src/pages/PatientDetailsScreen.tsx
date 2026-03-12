import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  AlertCircle,
  Stethoscope,
  Activity } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiGet } from '../services/api';

export function PatientDetailsScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointment_id');
  
  const [appointment, setAppointment] = useState<any>(null);
  const [consultationStatus, setConsultationStatus] = useState<string>('Pending');
  const [isLoading, setIsLoading] = useState(true);

  // Persistence: Restore session from localStorage
  const userId = localStorage.getItem('user_id');
  const role = localStorage.getItem('role');

  useEffect(() => {
    // Session Verification
    if (!userId || !role) {
      console.warn('Session missing, redirecting to login');
      navigate('/login');
      return;
    }

    if (!appointmentId) {
      navigate('/upcoming-appointments');
      return;
    }

    loadData();
  }, [appointmentId, userId, role]);

  const loadData = async () => {
    try {
      if (!isLoading) setIsLoading(true);
      
      const aptData = await apiGet(`/api/appointment/${appointmentId}`);
      setAppointment(aptData);

      const statusData = await apiGet(`/api/consultation/status/${appointmentId}`, {
        user_id: userId,
        role: role
      });
      setConsultationStatus(statusData.consultation_status);

    } catch (error) {
      console.error('Failed to load appointment details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId && consultationStatus === 'Pending') {
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await apiGet(`/api/consultation/status/${appointmentId}`, {
            user_id: userId,
            role: role
          });
          setConsultationStatus(statusData.consultation_status);
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 10000);
      return () => clearInterval(pollInterval);
    }
  }, [appointmentId, consultationStatus, userId, role]);

  if (isLoading) {
    return (
      <ScreenContainer title="Appointment Details" showBack>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ScreenContainer>
    );
  }

  if (!appointment) {
    return (
      <ScreenContainer title="Appointment Details" showBack>
        <div className="p-6 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={48} />
          <p className="text-gray-500">Appointment not found.</p>
        </div>
      </ScreenContainer>
    );
  }

  const isReady = consultationStatus === 'Ready' || consultationStatus === 'Live';

  return (
    <ScreenContainer title="Appointment Details" showBack className="bg-gray-50">
      <div className="px-6 py-6 space-y-6">
        {/* Doctor Info Card */}
        <Card className="p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-primary overflow-hidden border-2 border-white shadow-sm">
                {appointment.doctor_image ? (
                    <img src={appointment.doctor_image} alt={appointment.doctor_name} className="w-full h-full object-cover" />
                ) : (
                    <Stethoscope size={40} />
                )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{appointment.doctor_name}</h2>
              <p className="text-primary font-medium">{appointment.specialization}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={appointment.status === 'Completed' ? 'success' : 'info'}>
                  {appointment.status}
                </Badge>
                {isReady && (
                   <Badge variant="success" className="animate-pulse">Live Now</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Date</p>
                <p className="font-bold text-gray-700">{appointment.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Time</p>
                <p className="font-bold text-gray-700">{appointment.time || appointment.time_slot}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Appointment Status / Consultation Section */}
        <Card className="overflow-hidden border-none shadow-md">
          <div className={`p-4 flex items-center justify-between ${isReady ? 'bg-green-50' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-2">
               <Activity size={20} className={isReady ? 'text-green-600' : 'text-blue-600'} />
               <h3 className={`font-bold uppercase tracking-wide ${isReady ? 'text-green-800' : 'text-blue-800'}`}>
                 Consultation Status
               </h3>
            </div>
            <span className={`font-bold ${isReady ? 'text-green-600' : 'text-blue-600'}`}>
              {consultationStatus}
            </span>
          </div>
          <div className="p-6">
            {isReady ? (
               <div className="text-center">
                 <p className="text-gray-600 mb-4">The doctor is ready for your consultation. You can join the video call now.</p>
                 <Button 
                   fullWidth 
                   icon={<Video size={20} />} 
                   onClick={() => navigate('/patient-waiting-room', { 
                     state: { 
                       appointmentId: appointment.id,
                       doctorName: appointment.doctor_name,
                       specialization: appointment.specialization
                     } 
                   })}
                 >
                   Join Consultation
                 </Button>
               </div>
            ) : (
               <div className="text-center">
                 <p className="text-gray-500 italic">
                   {appointment.status === 'Completed' 
                     ? 'This consultation has been successfully completed.' 
                     : 'Please check back here at the scheduled time to join your consultation.'}
                 </p>
               </div>
            )}
          </div>
        </Card>

        {/* Patient Info Summary */}
        <div>
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Patient Details</h3>
           <Card className="p-4 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                 <span className="text-gray-500">Reason for Visit</span>
                 <span className="font-bold text-gray-800">{appointment.reason || 'General Consultation'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                 <span className="text-gray-500">Last Vital Check</span>
                 <span className="font-bold text-gray-800">Normal</span>
              </div>
              <div className="flex justify-between items-center py-2">
                 <span className="text-gray-500">Notes</span>
                 <span className="text-sm text-gray-400">None provided</span>
              </div>
           </Card>
        </div>

        {/* Back Action */}
        <div className="pt-4">
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/upcoming-appointments')}
          >
            Back to Appointments
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}