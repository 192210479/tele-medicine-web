import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, User } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MedicalIllustration } from '../components/illustrations/MedicalIllustration';
import { apiGet } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const appointmentId = location.state?.appointment_id;

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    } else {
      setIsLoading(false);
    }
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      const data = await apiGet(`/api/appointment/${appointmentId}`);
      setAppointment(data);
    } catch (error) {
      console.error('Failed to fetch appointment details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dashboardPath = 
    role === 'doctor' ? '/doctor-dashboard' :
    role === 'admin' ? '/admin-dashboard' :
    '/patient-dashboard';

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '10:00 AM - 10:30 AM';
    if (timeStr.includes('-')) return timeStr;
    
    try {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        
        const startTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        date.setMinutes(date.getMinutes() + 30);
        const endTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        
        return `${startTime} - ${endTime}`;
    } catch (e) {
        return timeStr;
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </ScreenContainer>
    );
  }

  const doctorImage = imageError ? null : `http://localhost:5000/api/uploads/doctors/${appointment?.doctor_id}.jpg`;

  return (
    <ScreenContainer 
      className="bg-white" 
      noScroll 
      showBack 
      onBack={() => navigate(dashboardPath)}
    >
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <MedicalIllustration type="success" className="w-48 h-48 mb-6" />

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-text-secondary mb-8">
            Your appointment has been successfully booked.
          </p>

          <Card className="w-full bg-surface border-none mb-6">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
              {doctorImage ? (
                <img
                  src={doctorImage}
                  alt="Doctor"
                  onError={() => setImageError(true)}
                  className="w-14 h-14 rounded-full object-cover bg-gray-100" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <User size={24} />
                </div>
              )}

              <div className="text-left py-4 px-2">
                <div className="mb-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-wider block mb-1">Doctor Name</span>
                  <h3 className="font-bold text-text-primary text-xl">
                    {appointment?.doctor_name || 'Doctor'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider block mb-1">Date</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                      <Calendar size={14} className="text-primary" />
                      {appointment?.date || 'Select Date'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider block mb-1">Time</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                      <Clock size={14} className="text-primary" />
                      {formatTime(appointment?.time || appointment?.time_slot)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Button fullWidth onClick={() => navigate(dashboardPath)}>
          Go to Dashboard
        </Button>
      </div>
    </ScreenContainer>
  );
}