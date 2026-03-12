import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiGet } from '../services/api';

// Fixed import for lucide-react
import { FileText as FileIcon, Clock as ClockIcon, CheckCircle as CheckIcon } from 'lucide-react';

export function PatientWaitingForPrescriptionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId, doctorName, specialization } = location.state || {};
  
  const [prescriptionReady, setPrescriptionReady] = useState(false);
  const [waitingTime, setWaitingTime] = useState(0);

  useEffect(() => {
    if (!appointmentId) {
        navigate('/upcoming-appointments');
        return;
    }

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    const timer = setInterval(() => setWaitingTime((prev) => prev + 1), 1000);

    return () => {
        clearInterval(interval);
        clearInterval(timer);
    };
  }, [appointmentId]);

  const checkStatus = async () => {
    try {
      const data = await apiGet(`/api/prescription/status/${appointmentId}`);
      if (data.status === 'Ready') {
        setPrescriptionReady(true);
      }
    } catch (error) {
      console.error('Failed to check prescription status:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenContainer className="bg-white" noScroll>
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {prescriptionReady ?
          <>
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <CheckIcon size={48} className="text-success" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Prescription Ready!
              </h1>
              <p className="text-text-secondary mb-8">
                Your doctor has completed your prescription
              </p>
            </> :

          <>
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <FileIcon size={48} className="text-primary animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Consultation Ended
              </h1>
              <p className="text-text-secondary mb-4">
                Doctor is preparing your prescription
              </p>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <ClockIcon size={16} />
                <span>Waiting: {formatTime(waitingTime)}</span>
              </div>
            </>
          }

          <Card className="w-full mt-8 bg-blue-50 border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                <FileIcon size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-text-primary">{doctorName || 'Doctor'}</h3>
                <p className="text-sm text-text-secondary">{specialization || 'Consultant'}</p>
              </div>
            </div>
            <p className="text-sm text-blue-800 font-medium">
              {prescriptionReady ?
              'Your prescription is ready to view' :
              'Your doctor is reviewing your case and preparing your prescription'}
            </p>
          </Card>
        </div>

        {prescriptionReady ?
        <div className="space-y-3">
            <Button
            fullWidth
            icon={<FileIcon size={18} />}
            onClick={() => navigate(`/prescription/${appointmentId}`)}>
              View Prescription
            </Button>
            <Button
            variant="ghost"
            fullWidth
            onClick={() => navigate('/patient-dashboard')}>
              Back to Dashboard
            </Button>
          </div> :

        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate('/patient-dashboard')}>
            Return to Dashboard
          </Button>
        }
      </div>
    </ScreenContainer>);
}