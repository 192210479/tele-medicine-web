import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Video, MessageSquare, Upload, Clock } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getAuth } from "../utils/auth";
import { getSocket } from "../utils/socketUtils";

export function PatientWaitingRoomScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment;
  const appointmentId = appointment?.id;
  
  const auth = getAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [checking, setChecking] = useState(false);
  const [doctorStarted, setDoctorStarted] = useState(false);
  const [waitingTime, setWaitingTime] = useState(0);

  async function checkAndJoin(apptId: number) {
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/consultation/status/${apptId}`);
      const data = await res.json();

      // can_join is true when status is "Ready" or "Ongoing"
      if (data.can_join && data.channel && data.consultation_id) {
        stopPolling();
        setDoctorStarted(true);
        navigateToVideoRoom(data.consultation_id, data.channel, apptId);
      }
    } catch (e) {
      console.error("Status check failed:", e);
    } finally {
      setChecking(false);
    }
  }

  function navigateToVideoRoom(
    consultationId: number,
    channel: string,
    apptId: number
  ) {
    navigate("/consultation/video", {
      state: {
        consultation_id: consultationId,
        channel:         channel,
        appointment_id:  apptId,
        role:            "patient",
        user_id:         auth?.user_id,
      },
      replace: true,
    });
  }

  function startPolling(apptId: number) {
    checkAndJoin(apptId);
    pollRef.current = setInterval(() => checkAndJoin(apptId), 3000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    if (!appointmentId) {
      navigate('/upcoming-appointments');
      return;
    }

    const socket = getSocket();
    
    // 1. Socket listener for started
    socket.on("consultation_started", (data: {
      appointment_id: number;
      channel: string;
    }) => {
      if (Number(data.appointment_id) === Number(appointmentId)) {
        stopPolling();
        fetch(`/api/consultation/status/${appointmentId}`)
          .then(r => r.json())
          .then(status => {
            if (status.consultation_id) {
              setDoctorStarted(true);
              navigateToVideoRoom(status.consultation_id, data.channel, appointmentId);
            }
          });
      }
    });

    // 2. Socket listener for ready
    socket.on("consultation_ready", (data: { appointment_id: number }) => {
      if (Number(data.appointment_id) === Number(appointmentId)) {
        setDoctorStarted(true);
        checkAndJoin(appointmentId);
      }
    });

    // 3. Fallback polling
    startPolling(appointmentId);

    // Waiting timer for UI
    const timer = setInterval(() => setWaitingTime(prev => prev + 1), 1000);

    return () => {
      stopPolling();
      socket.off("consultation_started");
      socket.off("consultation_ready");
      clearInterval(timer);
    };
  }, [appointmentId, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!appointment) return null;

  return (
    <ScreenContainer title="Consultation Waiting Room" showBack className="bg-surface">
      <div className="flex flex-col h-full min-h-[600px] px-6 py-6 pb-8">
        <Card className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment.doctor_name || 'Dr'}`}
              alt="Doctor"
              className="w-16 h-16 rounded-full object-cover bg-gray-200" />
            
            <div className="flex-1">
              <h2 className="text-lg font-bold text-text-primary">
                {appointment.doctor_name}
              </h2>
              <p className="text-sm text-text-secondary">{appointment.specialization || 'Specialist'}</p>
            </div>
            <Badge variant={doctorStarted ? 'success' : 'warning'}>
              {doctorStarted ? 'Ready' : 'Preparing'}
            </Badge>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Clock size={16} />
              <span className="font-medium">
                {doctorStarted ?
                'Doctor is ready for the consultation!' :
                `Waiting: ${formatTime(waitingTime)}`}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {doctorStarted ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Video size={40} className="text-success" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Consultation is Ready
              </h3>
              <p className="text-text-secondary mb-8">
                Your doctor has joined. Connecting to video call...
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Clock size={40} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Waiting for Doctor...
              </h3>
              <p className="text-text-secondary mb-8">
                Please stay on this screen. Your consultation will start automatically when the doctor is ready.
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <Button
            fullWidth
            icon={<Video size={20} />}
            disabled={!doctorStarted}
            className={!doctorStarted ? 'opacity-50 cursor-not-allowed' : ''}>
            {doctorStarted ? 'Joining Call...' : 'Waiting Room'}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" icon={<MessageSquare size={18} />} className="text-sm">Chat</Button>
            <Button variant="outline" icon={<Upload size={18} />} className="text-sm">Upload Reports</Button>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}
