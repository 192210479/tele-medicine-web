import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConsultation } from '../hooks/useConsultation';
import { Button } from '../components/ui/Button';
import { User, Stethoscope, Loader2 } from 'lucide-react';
import { getAuth } from '../utils/auth';
import { getSocket } from '../utils/socketUtils';

export const DoctorConsultationFlow: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { role: authRole } = useAuth();
  const auth = getAuth();

  const role = authRole ?? localStorage.getItem('role') ?? 'doctor';
  const apptId = Number(appointmentId);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const consultation = useConsultation({
    appointmentId: apptId,
    userId: auth?.user_id || 0,
    role: "doctor",
  });

  if (role !== 'doctor') {
    return <Navigate to={`/consultation/${appointmentId}`} replace />;
  }

  const handleStartConsultation = async () => {
    if (!auth || !apptId) return;
    setStarting(true);
    setError('');

    try {
      // 1. Start session
      const startRes = await fetch("/api/consultation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: apptId,
          doctor_id: auth.user_id,
        }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        setError(startData.error || "Failed to start consultation");
        return;
      }

      const { consultation_id, channel } = startData;

      // Re-affirm socket room membership before navigating (redundancy)
      const socket = getSocket();
      socket.emit('join', {
        user_id: Number(auth.user_id),
        role:    'doctor',
      });

      // 2. Get Agora token — DOCTOR uses user_id + 100000 to avoid collision
      const doctorAgoraUid = auth.user_id + 100000;

      const tokenRes = await fetch(
        `/api/video/token?channel_name=${channel}&uid=${doctorAgoraUid}`
      );
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        setError(tokenData.error || "Failed to get video token");
        return;
      }

      const { token, uid: backendUid } = tokenData;

      // 3. Navigate to Video Room
      navigate("/consultation/video", {
        state: {
          consultation_id,
          channel,
          token,
          uid: doctorAgoraUid, // Ensure we pass the offset UID
          appointment_id: apptId,
          role: "doctor",
          user_id: auth.user_id,
        },
        replace: true,
      });

    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const navState = (location.state as any) || {};
  const { patientName = 'Patient' } = navState;

  // We only care about the waiting phase here. If the consultation is already "Ongoing", 
  // the doctor can just click "Start" again (or we could auto-navigate if status check confirms it).

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F4F8] p-6 text-center">
      <div className="bg-white rounded-[32px] shadow-2xl p-10 max-w-md w-full">
        <div className="w-24 h-24 bg-blue-50 rounded-[24px] flex items-center justify-center mb-6 mx-auto">
          <User className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-black mb-2">{patientName}</h2>
        <p className="text-gray-500 mb-8">Ready to begin the consultation session?</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 border border-red-100 italic">
            {error}
          </div>
        )}

        <Button
          className="w-full py-7 text-lg rounded-2xl flex gap-3 items-center justify-center bg-blue-600 shadow-xl shadow-blue-600/20"
          onClick={handleStartConsultation}
          isLoading={starting}
          disabled={starting}
        >
          {starting ? <Loader2 className="animate-spin" /> : <Stethoscope />}
          {starting ? "Starting..." : "Start Consultation"}
        </Button>
      </div>
    </div>
  );
};
