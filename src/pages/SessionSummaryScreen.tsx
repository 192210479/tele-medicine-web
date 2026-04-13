import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, User, FileText, Calendar, Star } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MedicalIllustration } from '../components/illustrations/MedicalIllustration';

interface SessionState {
  appointment_id?: number;
  doctor_id?: number;
  doctor_name?: string;
  specialization?: string;
  doctor_image?: string | null;
  date?: string;
  time?: string;
  duration?: string;
  prescription_ready?: boolean;
}

export function SessionSummaryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as SessionState) || {};

  const appointmentId = state.appointment_id;
  const doctorId = state.doctor_id;
  const doctorName = state.doctor_name || 'Your Doctor';
  const specialization = state.specialization || '';
  const doctorImage = state.doctor_image || null;
  const date = state.date || '—';
  const time = state.time || '—';
  const duration = state.duration || '—';
  const prescriptionReady = state.prescription_ready ?? false;

  const handleRateDoctor = () => {
    navigate('/rate-doctor', {
      state: {
        appointment_id: appointmentId,
        doctor_id: doctorId,
        doctor_name: doctorName,
        specialization,
        doctor_image: doctorImage,
      },
    });
  };

  const handleViewPrescription = () => {
    if (appointmentId) navigate(`/prescription/${appointmentId}`);
  };

  return (
    <ScreenContainer className="bg-white" noScroll>
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center">
          <MedicalIllustration type="success" className="w-40 h-40 mb-6" />

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Consultation Complete
          </h1>
          <p className="text-text-secondary mb-8 text-center">
            Your consultation has been successfully completed.
          </p>

          <Card className="w-full mb-6">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-primary overflow-hidden">
                {doctorImage ? (
                  <img src={doctorImage} alt={doctorName} className="w-full h-full object-cover" />
                ) : (
                  <User size={28} />
                )}
              </div>
              <div>
                <h3 className="font-bold text-text-primary">{doctorName}</h3>
                {specialization && (
                  <p className="text-sm text-text-secondary">{specialization}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={16} />
                  <span>Date</span>
                </div>
                <span className="font-medium text-text-primary">{date}</span>
              </div>

              {time !== '—' && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock size={16} />
                    <span>Time</span>
                  </div>
                  <span className="font-medium text-text-primary">{time}</span>
                </div>
              )}

              {duration !== '—' && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock size={16} />
                    <span>Duration</span>
                  </div>
                  <span className="font-medium text-text-primary">{duration}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <FileText size={16} />
                  <span>Prescription</span>
                </div>
                <Badge variant={prescriptionReady ? 'success' : 'warning'}>
                  {prescriptionReady ? 'Ready' : 'Pending'}
                </Badge>
              </div>
            </div>
          </Card>

          <div className="w-full space-y-3">
            {prescriptionReady && appointmentId && (
              <Button fullWidth onClick={handleViewPrescription} icon={<FileText size={18} />}>
                View Prescription
              </Button>
            )}

            {appointmentId && doctorId && (
              <Button fullWidth variant="secondary" icon={<Star size={18} />} onClick={handleRateDoctor}>
                Rate Doctor
              </Button>
            )}

            <Button fullWidth variant="outline" onClick={() => navigate('/book-appointment')}>
              Book Follow-up
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate('/patient-dashboard')}
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    </ScreenContainer>
  );
}