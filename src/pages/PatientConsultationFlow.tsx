import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConsultation } from '../hooks/useConsultation';
import { useAgoraClient } from '../hooks/useAgoraClient';
import { useCallTimer } from '../hooks/useCallTimer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DoctorAvatar } from '../components/ui/DoctorAvatar';
import { 
  Mic, MicOff, Video, VideoOff, MessageSquare, 
  Paperclip, PhoneOff, X, Send, Download, 
  CheckCircle, Clock, AlertCircle, Loader2
} from 'lucide-react';
import { getAuth } from "../utils/auth";
import { getSocket } from "../utils/socketUtils";

export const PatientConsultationFlow: React.FC = () => {
  const { appointmentId: id } = useParams<{ appointmentId: string }>();
  const appointmentId = id ? parseInt(id, 10) : null;
  const location = useLocation();
  const navigate = useNavigate();
  const { userId: authId, role: authRole } = useAuth();
  const auth = getAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const patientId = authId ?? Number(localStorage.getItem('user_id'));
  const role = authRole ?? localStorage.getItem('role') ?? 'patient';
  const apptId = appointmentId || 0;

  useEffect(() => {
    // Guard: need a valid appointment ID and logged-in user
    if (!appointmentId || !auth) return;

    // ─────────────────────────────────────────────────────────
    // FUNCTION: check status and navigate if ready
    // ─────────────────────────────────────────────────────────
    async function checkStatus() {
      try {
        const res  = await fetch(`/api/consultation/status/${appointmentId}`);
        if (!res.ok) return;
        const data = await res.json();

        // can_join is true when doctor has started (status = "Ready" or "Ongoing")
        if (data.can_join === true && data.channel) {
          // Stop polling — we're navigating away
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }

          // Fetch Agora token for the patient
          const tokenRes = await fetch(
            `/api/video/token?channel_name=${data.channel}&uid=${auth!.user_id}`
          );
          if (!tokenRes.ok) return;
          const tokenData = await tokenRes.json();

          // Navigate to video room with all needed data
          navigate("/consultation/video", {
            state: {
              consultation_id : data.consultation_id,
              channel         : data.channel,
              token           : tokenData.token,
              uid             : tokenData.uid,       // use exact uid from backend
              appointment_id  : appointmentId,
              role            : "patient",
              user_id         : auth!.user_id,
            },
            replace: true,  // prevent back button returning to waiting screen
          });
        }
      } catch (err) {
        console.error("Consultation status check failed:", err);
      }
    }

    // ─────────────────────────────────────────────────────────
    // SOCKET: instant navigation when doctor clicks "Start"
    // ─────────────────────────────────────────────────────────
    const socket = getSocket();

    // Named handlers — required so socket.off() removes only THIS effect's listeners
    const handleStarted = (data: { appointment_id: number; channel: string }) => {
      if (Number(data.appointment_id) === Number(appointmentId)) {
        checkStatus(); // will navigate if can_join is true
      }
    };

    socket.on("consultation_started", handleStarted);
    socket.on("consultation_ready",   handleStarted); // backend emits both

    // ─────────────────────────────────────────────────────────
    // POLLING: fallback every 5 seconds if socket is missed
    // ─────────────────────────────────────────────────────────
    checkStatus(); // check immediately on mount
    pollRef.current = setInterval(checkStatus, 5000); // 5s only

    // ─────────────────────────────────────────────────────────
    // CLEANUP: stop everything when component unmounts
    // ─────────────────────────────────────────────────────────
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      // Pass exact handler ref — avoids stripping unrelated listeners
      socket.off("consultation_started", handleStarted);
      socket.off("consultation_ready",   handleStarted);
    };

  }, [appointmentId]); // SINGLE dependency — auth ref changes must not re-run this

  if (role === 'doctor') {
    return <Navigate to={`/doctor-consultation/${appointmentId}`} replace />;
  }

  const consultation = useConsultation({
    appointmentId: apptId,
    userId:        patientId,
    role:          "patient",
  });
  
  const agora   = useAgoraClient();
  const elapsed = useCallTimer(consultation.startTimeUtc);
  const agoraJoinedRef = useRef(false);

  useEffect(() => {
    if (consultation.phase === "in_call"
        && consultation.channel && consultation.token
        && !agoraJoinedRef.current) {
      agoraJoinedRef.current = true;
      agora.joinChannel(
        consultation.channel,
        consultation.token,
        patientId,
      );
    }
    if (["call_ended", "prescription", "rx_ready"].includes(consultation.phase)
        && agoraJoinedRef.current) {
      agora.leaveChannel();
      agoraJoinedRef.current = false;
    }
  }, [consultation.phase, consultation.channel, consultation.token, patientId]);

  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consultation.messages, showChat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      consultation.sendMessage(messageText.trim());
      setMessageText('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointment_id', String(apptId));
    formData.append('patient_id', String(patientId));
    formData.append('role', 'patient');
    formData.append('record_type', 'Consultation Attachment');

    try {
      const res = await fetch(`/api/patient/upload-medical-record`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert('File uploaded and shared with doctor');
      } else {
        const errData = await res.json();
        alert(`Upload failed: ${errData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error during upload');
    }
  };

  const navState = (location.state as any) || {};
  const { 
    doctorName = 'Doctor', 
    doctorAvatar = '',
    time = '' 
  } = navState;

  if (consultation.phase === "waiting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="relative mb-8"><div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-75"></div><DoctorAvatar name={doctorName} image={doctorAvatar} size="lg" className="relative z-10 border-4 border-white shadow-xl" /></div>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Waiting for Dr. {doctorName}</h2>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm mb-12"><Clock className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-gray-700">{time || 'Now'}</span></div>
        <Button variant="outline" onClick={() => navigate(-1)} className="hover:bg-red-50 hover:text-red-600 transition-colors">Cancel</Button>
      </div>
    );
  }

  if (consultation.phase === "doctor_ready") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center flex flex-col items-center">
          <DoctorAvatar name={doctorName} image={doctorAvatar} size="lg" className="mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Doctor is Ready!</h2>
          <Button className="w-full py-6 text-lg rounded-2xl bg-blue-600" onClick={() => consultation.emitJoinCall()}>Join Consultation</Button>
        </div>
      </div>
    );
  }

  if (consultation.phase === "in_call" || consultation.phase === "waiting_patient_join") {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col text-white">
        <div style={{ position: "relative", width: "100%", height: "calc(100vh - 80px)", background: "#000" }}>
          {/* Main video — remote user */}
          <div
            ref={agora.setRemoteEl}
            style={{
              position:   "absolute",
              inset:       0,
              width:      "100%",
              height:     "100%",
              background: "#111",
            }}
          />
          
          {/* Local video — your camera */}
          <div
            ref={agora.setLocalEl}
            style={{
              position:     "absolute",
              bottom:       "90px",
              right:        "16px",
              width:        "140px",
              height:       "100px",
              background:   "#222",
              borderRadius: "10px",
              overflow:     "hidden",
              border:       "2px solid rgba(255,255,255,0.3)",
              zIndex:       10,
            }}
          />
          
          <div style={{ position: "absolute", bottom: "94px", right: "20px", zIndex: 11, color: "white", fontSize: "10px", background: "rgba(0,0,0,0.55)", padding: "1px 5px", borderRadius: "4px" }}>You</div>

          <div style={{ position: "absolute", top: "16px", left: "16px", zIndex: 10, display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.55)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: 600 }}>
            <span style={{ width: "8px", height: "8px", background: "#ff4444", borderRadius: "50%" }} />
            {elapsed} · Dr. {doctorName}
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-gray-950 px-6 py-6 flex items-center justify-center gap-6 z-30 overflow-hidden border-t border-white/5">
          <button 
            onClick={() => {
              const n = !agora.micEnabled;
              agora.toggleMic(n);
              consultation.emitToggleMic(n);
            }} 
            className={`w-12 h-12 rounded-full flex items-center justify-center ${agora.micEnabled ? 'bg-white/10' : 'bg-red-500'}`}
          >
            {agora.micEnabled ? <Mic /> : <MicOff />}
          </button>
          <button 
            onClick={() => {
              const n = !agora.camEnabled;
              agora.toggleCamera(n);
              consultation.emitToggleCamera(n);
            }} 
            className={`w-12 h-12 rounded-full flex items-center justify-center ${agora.camEnabled ? 'bg-white/10' : 'bg-red-500'}`}
          >
            {agora.camEnabled ? <Video /> : <VideoOff />}
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`w-12 h-12 rounded-full flex items-center justify-center ${showChat ? 'bg-blue-600' : 'bg-white/10'}`}><MessageSquare /></button>
          <label className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"><Paperclip /><input type="file" className="hidden" onChange={handleFileUpload} /></label>
          <button onClick={() => consultation.emitEndCall()} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl"><PhoneOff /></button>
        </div>

        {showChat && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white text-gray-900 shadow-2xl z-40 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between"><h3 className="font-bold text-xs uppercase text-blue-800">Doctor Chat</h3><button onClick={() => setShowChat(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {consultation.messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.senderRole === 'patient' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl ${msg.senderRole === 'patient' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}><p className="text-sm">{msg.message}</p></div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-50 border rounded-xl px-4 py-3 outline-none" />
              <button type="submit" className="bg-blue-600 text-white px-4 rounded-xl font-bold"><Send className="w-5 h-5" /></button>
            </form>
          </div>
        )}
      </div>
    );
  }

  if (consultation.phase === "call_ended") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/40 backdrop-blur-xl p-6">
        <div className="bg-white rounded-[32px] p-10 max-sm w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto"><PhoneOff className="w-10 h-10 text-red-500" /></div>
          <h3 className="text-2xl font-black mb-4 italic uppercase text-gray-300">Ended</h3>
          <p className="mb-8 text-gray-600">
            {consultation.callEndedBy === "patient" ? "You ended the call" : 
             consultation.callEndReason === "network_disconnect" ? "Lost connection" : "Doctor ended the call"}
          </p>
          <Button className="w-full py-6 rounded-2xl bg-gray-900" onClick={() => consultation.setPhase("prescription")}>OKAY</Button>
        </div>
      </div>
    );
  }

  if (consultation.phase === "prescription") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" /><h2 className="text-2xl font-bold mb-2">Preparing Prescription</h2>
        <p className="text-gray-500 text-center">Doctor is typing medical advice...</p>
      </div>
    );
  }

  if (consultation.phase === "rx_ready") return <PatientPrescriptionDetail appointmentId={apptId} userId={patientId} />;

  return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;
};

const PatientPrescriptionDetail: React.FC<{ appointmentId: number, userId: number }> = ({ appointmentId, userId }) => {
  const [rx, setRx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/prescription/${appointmentId}?user_id=${userId}&role=patient`)
      .then(r => r.json()).then(d => { setRx(d); setLoading(false); }).catch(() => setLoading(false));
  }, [appointmentId, userId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white flex justify-between items-center font-bold">Prescription Overview<Button className="bg-white text-blue-600"><Download /></Button></div>
        <div className="p-8 space-y-6">
          <section><h3 className="text-xs font-black uppercase text-blue-600 mb-4">Diagnosis</h3><div className="p-6 bg-blue-50 rounded-2xl font-medium">{rx?.diagnosis}</div></section>
          <section><h3 className="text-xs font-black uppercase text-blue-600 mb-4">Medicines</h3><div className="space-y-2">{rx?.medicines?.map((m: any, i: number) => <div key={i} className="p-3 border rounded-xl">{m.name} - {m.dosage}</div>)}</div></section>
          <Button variant="outline" className="w-full" onClick={() => navigate('/home')}>Return Home</Button>
        </div>
      </div>
    </div>
  );
};
