import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  X
} from
  'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useConsultation } from '../hooks/useConsultation';
import { useAgoraClient } from '../hooks/useAgoraClient';

export function PatientVideoCallScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: authId } = useAuth();
  const appointment = location.state?.appointment;
  const userId = authId ?? Number(localStorage.getItem('user_id'));

  const agora = useAgoraClient();
  const consultation = useConsultation({
    appointmentId: appointment?.id,
    userId,
    role: 'patient'
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!appointment) {
      navigate('/upcoming-appointments');
    }
  }, [appointment, navigate]);

  // Auto-join if doctor is ready (or call it on button click if one exists)
  useEffect(() => {
    if (consultation.phase === 'doctor_ready') {
      consultation.emitJoinCall();
    }
  }, [consultation.phase]);

  // Join Agora when tech details ready from start_call
  useEffect(() => {
    if (consultation.phase === 'in_call'
      && consultation.channel
      && consultation.token
      && consultation.uid
      && !agora.joined) {
      agora.joinChannel(
        consultation.channel,
        consultation.token,
        consultation.uid
      );
    }
  }, [consultation.phase, consultation.channel, consultation.token, consultation.uid, agora.joined]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (agora.joined) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [agora.joined]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      agora.leaveChannel();
    };
  }, []);

  const toggleMic = () => {
    const next = !isMuted;
    setIsMuted(next);
    agora.toggleMic(!next);
    consultation.emitToggleMic(!next);
  };

  const toggleCamera = () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    agora.toggleCamera(!next);
    consultation.emitToggleCamera(!next);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    consultation.sendMessage(newMessage.trim());
    setNewMessage('');
  };

  useEffect(() => {
    if (consultation.phase === 'call_ended' && consultation.callEndedBy === 'doctor') {
      alert("Doctor ends the call");
      navigate('/consultation/prescription-waiting', { 
        state: { 
          appointment_id: appointment.id,
          appointment: appointment
        } 
      });
    }
  }, [consultation.phase, consultation.callEndedBy, navigate, appointment]);

  const handleEndCall = async () => {
    await agora.leaveChannel();
    consultation.emitEndCall();
    navigate('/consultation/prescription-waiting', { state: { appointment_id: appointment.id, appointment } });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!appointment) return null;

  return (
    <ScreenContainer noScroll className="bg-[#0a0a0b]">
      <div className="relative h-full w-full min-h-[600px]">
        {/* Remote Video (Doctor) */}
        {!agora.joined ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 border-2 border-primary/20 m-4 rounded-[40px] overflow-hidden">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-bold animate-pulse">Establishing Secure Connection...</p>
            <p className="text-gray-500 text-sm mt-2">Waiting for doctor to sync audio/video</p>
          </div>
        ) : (
          <div ref={agora.setRemoteEl} className="w-full h-full bg-black object-cover" />
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]" />
            <span className="font-mono text-white text-sm font-bold tracking-widest">{formatDuration(callDuration)}</span>
          </div>
          <h2 className="text-white text-sm font-black uppercase tracking-[0.2em] shadow-sm">
            Dr. {appointment.doctor_name}
          </h2>
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
            <Video size={18} />
          </div>
        </div>

        {/* Self View */}
        <div className="absolute top-24 right-6 w-32 h-44 bg-gray-800 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl z-10 group">
          <div ref={agora.setLocalEl} className="w-full h-full bg-gray-700" />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <VideoOff size={24} className="text-white/40" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] text-white font-bold tracking-tighter uppercase">YOU</div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-0 right-0 px-8 z-20 flex justify-center">
          <div className="bg-black/60 backdrop-blur-2xl px-8 py-5 rounded-[40px] border border-white/10 shadow-2xl flex items-center gap-6">
            <button
              onClick={toggleMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isMuted ? 'bg-white text-gray-900 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isMuted ? <MicOff size={26} /> : <Mic size={26} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isVideoOff ? 'bg-white text-gray-900 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isVideoOff ? <VideoOff size={26} /> : <Video size={26} />}
            </button>

            <button
              onClick={() => setShowEndCallModal(true)}
              className="w-16 h-16 rounded-full bg-[#FF3B30] text-white shadow-[0_8px_24px_rgba(255,59,48,0.4)] flex items-center justify-center hover:bg-red-600 transition-all transform hover:scale-105 active:scale-90">
              <PhoneOff size={32} />
            </button>

            <button
              onClick={() => setShowChat(true)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${showChat ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              <MessageSquare size={26} />
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-t-[40px] h-[75%] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[40px]">
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Consultation Chat</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">MESSAGES ARE SECURE & ENCRYPTED</p>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                {consultation.messages.map((m: any, i: number) => (
                  <div key={i} className={`flex ${m.senderRole === 'patient' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 max-w-[80%] shadow-sm ${m.senderRole === 'patient' ? 'bg-primary text-white rounded-3xl rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-3xl rounded-tl-none'}`}>
                      <p className="text-sm font-medium leading-relaxed">{m.message}</p>
                      <span className={`text-[9px] font-bold mt-2 block ${m.senderRole === 'patient' ? 'text-white/60' : 'text-gray-400'}`}>{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-8 py-6 border-t border-gray-100 bg-white pb-10">
                <div className="flex gap-3 bg-gray-100 p-2 rounded-full focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Tap to message Dr..."
                    className="flex-1 px-4 bg-transparent text-sm font-bold focus:outline-none" />
                  <button onClick={sendMessage} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        title="Leave Consultation"
        description="Are you sure you want to end this session? You will be moved to the prescription waiting area."
        confirmText="End Session"
        cancelText="Stay in Call"
        onConfirm={handleEndCall}
        variant="danger" />
    </ScreenContainer>
  );
}
