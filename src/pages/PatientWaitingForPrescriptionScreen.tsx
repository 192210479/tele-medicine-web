import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import socketService from '../services/consultationSocket';

export function PatientWaitingForPrescriptionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment;

  const [prescriptionReady, setPrescriptionReady] = useState(false);
  const [waitingTime, setWaitingTime] = useState(0);

  useEffect(() => {
    if (!appointment) {
      navigate('/patient-dashboard');
      return;
    }

    socketService.connect();
    socketService.joinRoom(`consultation_${appointment.id}`);

    socketService.on('prescription_ready', (data) => {
      console.log("Prescription is ready:", data);
      setPrescriptionReady(true);
    });

    return () => {
      socketService.off('prescription_ready');
    };
  }, [appointment, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!appointment) return null;

  return (
    <ScreenContainer className="bg-white" noScroll>
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {prescriptionReady ?
            <>
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle size={48} className="text-success" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">
                Prescription Ready!
              </h1>
              <p className="text-gray-500 font-bold mb-8">
                Dr. {appointment.doctor_name} has completed your medical report.
              </p>
            </> :

            <>
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                <div className="relative w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText size={48} className="text-primary animate-pulse" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                Finalizing Session
              </h1>
              <p className="text-gray-400 font-bold mb-4">
                Please wait while your doctor prepares the final prescription and records.
              </p>
              <div className="flex items-center gap-2 text-xs font-black text-primary px-4 py-2 bg-blue-50 rounded-full">
                <Clock size={14} />
                <span>PENDING: {formatTime(waitingTime)}</span>
              </div>
            </>
          }

          <Card className="w-full mt-10 bg-gray-50 border-none shadow-sm p-6 text-left">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment.doctor_name || 'Dr'}`}
                className="w-14 h-14 rounded-full border-2 border-white shadow-sm"
              />
              <div>
                <h3 className="font-black text-gray-900 leading-tight">{appointment.doctor_name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{appointment.specialization || 'Cardiologist'}</p>
              </div>
            </div>
            <div className="h-px bg-gray-200 w-full mb-4" />
            <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
              {prescriptionReady ?
                'AUTHENTICATED PRESCRIPTION GENERATED. YOU CAN NOW VIEW AND DOWNLOAD.' :
                'SECURE SESSION CLOSED. DOCTOR IS ACTIVELY CREATING YOUR PRESCRIPTION...'}
            </p>
          </Card>
        </div>

        <div className="space-y-3 pb-8">
          {prescriptionReady ? (
            <Button
              fullWidth
              className="py-5 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
              icon={<FileText size={18} />}
              onClick={() => navigate(`/prescription/${appointment.id}`)}>
              View Prescription
            </Button>
          ) : (
            <Button
              variant="outline"
              fullWidth
              className="py-5 font-black uppercase tracking-widest text-xs border-2"
              onClick={() => navigate('/patient-dashboard')}>
              Minimize to Dashboard
            </Button>
          )}
        </div>
      </div>
    </ScreenContainer>);
}
