import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Video, MessageSquare, Upload, Clock } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiGet, apiPost, apiUpload } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function PatientWaitingRoomScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const { appointmentId, doctorName, specialization, doctorImage } = location.state || {};
  
  const [consultationStatus, setConsultationStatus] = useState('Pending');
  const [waitingTime, setWaitingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!appointmentId) {
      navigate('/upcoming-appointments');
      return;
    }

    loadAppointment();
    checkStatus();
    
    // Status polling every 3 seconds
    const statusInterval = setInterval(checkStatus, 3000);

    // Waiting timer
    const timer = setInterval(() => {
      setWaitingTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(timer);
    };
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      await apiGet(`/api/appointment/${appointmentId}`);
      // This will help us get labels even if location.state is missing
    } catch (e) {
      console.error(e);
    }
  };

  const checkStatus = async () => {
    try {
      const data = await apiGet(`/api/consultation/status/${appointmentId}`);
      setConsultationStatus(data.consultation_status);
      
      if (data.consultation_status === 'Live' && !isTransitioning) {
          setIsTransitioning(true);
          setConsultationStatus('Live');
          // Immediately join and clear interval
          handleJoin();
      }
    } catch (error) {
      console.error('Failed to check status:', error);
      // Retry logic is implicit via interval
    }
  };

  const handleJoin = async () => {
    try {
      setIsLoading(true);
      const data = await apiPost(`/api/consultation/start/${appointmentId}`, {
        user_id: userId,
        role: 'patient'
      });
      
      if (data.video_room) {
        navigate('/patient-video-call', { 
          state: { 
            appointmentId, 
            videoRoom: data.video_room,
            doctorName,
            specialization
          } 
        });
      } else {
        alert("Session not ready yet");
      }
    } catch (error: any) {
      alert(error.message || 'Failed to join consultation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('user_id', userId?.toString() || '');
      formData.append('role', 'patient');
      formData.append('file', file);

      await apiUpload('/api/medical-record/upload', formData);
      alert('Medical report uploaded successfully');
    } catch (error) {
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isReady = consultationStatus === 'Ready' || consultationStatus === 'Live';

  return (
    <ScreenContainer title="Consultation" showBack className="bg-surface">
      <div className="flex flex-col h-full min-h-[600px] px-6 py-6 pb-8">
        {/* Doctor Info Card */}
        <Card className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold text-xl overflow-hidden border-2 border-white shadow-sm">
                {doctorImage ? (
                    <img
                        src={doctorImage}
                        alt={doctorName}
                        className="w-full h-full object-cover" />
                ) : (doctorName?.charAt(0) || 'D')}
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-text-primary">
                {doctorName || 'Doctor'}
              </h2>
              <p className="text-sm text-text-secondary">{specialization || 'Consultant'}</p>
            </div>
            <Badge variant={isReady ? 'success' : 'warning'}>
              {consultationStatus}
            </Badge>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Clock size={16} />
              <span className="font-medium">
                {isReady ?
                'Doctor is ready!' :
                `Waiting: ${formatTime(waitingTime)}`}
              </span>
            </div>
          </div>
        </Card>

        {/* Status Message */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {isReady ?
          <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Video size={40} className="text-success" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Consultation is Ready
              </h3>
              <p className="text-text-secondary mb-8">
                You can now join the video consultation with your doctor.
              </p>
            </> :

          <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Clock
                size={40}
                className="text-primary animate-spin"
                style={{
                  animationDuration: '3s'
                }} />

              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Waiting for Doctor
              </h3>
              <p className="text-text-secondary mb-8">
                Please wait while the doctor prepares for your consultation. We will notify you when they are ready.
              </p>
            </>
          }
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            fullWidth
            icon={<Video size={20} />}
            disabled={!isReady || isLoading}
            onClick={handleJoin}
            isLoading={isLoading}
            className={!isReady ? 'opacity-50 cursor-not-allowed' : ''}>

            {isReady ? 'Join Video Call' : 'Waiting for Doctor...'}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              icon={<MessageSquare size={18} />}
              onClick={() => navigate('/patient-video-call', { state: location.state })}
              className="text-sm">
              Chat
            </Button>
            <Button
              variant="outline"
              icon={<Upload size={18} />}
              onClick={() => fileInputRef.current?.click()}
              className="text-sm">
              Upload Reports
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </div>
        </div>
      </div>
    </ScreenContainer>);

}