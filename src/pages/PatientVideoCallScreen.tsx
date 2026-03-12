import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Upload,
  Send,
  X,
  FileCheck,
  AlertCircle } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Modal } from '../components/ui/Modal';
import { apiGet, apiPost, apiUpload } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function PatientVideoCallScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAppointmentId(params.get("appointment_id"));
  }, []);

  const [appointment, setAppointment] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);
  const [actualRoomId, setActualRoomId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState<any[]>([]);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const [socket, setSocket] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    if (userId && appointmentId) {
      initializeConsultation(appointmentId);
    }
    
    const timer = setInterval(() => {
      if (remoteUserJoined) setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (socket) socket.disconnect();
      clearInterval(timer);
      leaveAgora();
    };
  }, [userId, appointmentId, remoteUserJoined]);

  const initializeConsultation = async (id: string) => {
    try {
      const role = localStorage.getItem("role");
      const data = await apiGet(`/api/consultation/poll/${id}`, { user_id: userId, role });

      if (data.consultation_status === "Pending") {
        setIsWaiting(true);
        startPolling(id);
      } else if (data.consultation_status === "Live") {
        setIsWaiting(false);
        await startConsultationSession(id);
      } else if (data.consultation_status === "Completed") {
        navigate('/waiting-for-prescription', { state: { appointmentId: id } });
      }
      
      loadAppointmentData(id);
    } catch (error) {
      console.error("Initialization failed", error);
    }
  };

  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      const role = localStorage.getItem("role");
      try {
        const data = await apiGet(`/api/consultation/poll/${id}`, { user_id: userId, role });
        
        if (data.consultation_status === "Live") {
          clearInterval(interval);
          setIsWaiting(false);
          await startConsultationSession(id);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const startConsultationSession = async (id: string) => {
    try {
      const role = localStorage.getItem("role");
      const data = await apiPost(`/api/consultation/start/${id}`, { user_id: userId, role });
      
      if (data.video_room) {
        setActualRoomId(data.video_room);
        setSessionId(data.session_id);
        
        await setupCamera();
        initAgora(data.video_room);
        initSocket(data.video_room, id, data.session_id);
      }
    } catch (e) {
      console.error("Failed to start session", e);
    }
  };

  const initSocket = (room: string, id: string, sId: string) => {
    const { io } = window as any;
    if (!io) return;
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.emit("join_consultation", { room });
    newSocket.emit("join_room", { room });

    newSocket.on("consultation_started", (data: any) => {
      if (data.appointment_id == id) {
        // Already handled by startConsultationSession for patient
      }
    });

    newSocket.on("consultation_ended", (data: any) => {
      if (data.appointment_id == id) {
        leaveAgora();
        navigate('/waiting-for-prescription', { state: { appointmentId: id } });
      }
    });

    newSocket.on("receive_message", (msg: any) => {
      setMessages(prev => [...prev, {
        user_id: msg.sender_id,
        role: msg.sender_role,
        message: msg.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      if (!showChat) setHasNewMessage(true);
    });
  };

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setCameraStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (e) {
      console.error("Camera access failed", e);
      setError("Camera permission required");
    }
  };

  const loadAppointmentData = async (id: string) => {
    try {
      const data = await apiGet(`/api/appointment/${id}`);
      setAppointment(data);
    } catch (e) {
      console.error("Failed to load appointment", e);
    }
  };

  const initAgora = async (videoRoom: string) => {
    try {
      const { AgoraRTC } = window as any;
      if (!AgoraRTC) return;

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setAgoraClient(client);

      const AGORA_APP_ID = "24609660ace149ab90e66732d762f1e9";

      client.on("user-published", async (user: any, mediaType: string) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          setRemoteUserJoined(true);
          setRemoteVideoActive(true);
          user.videoTrack.play("remoteVideo");
        }
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });

      client.on("user-unpublished", (_user: any, mediaType: string) => {
        if (mediaType === "video") setRemoteVideoActive(false);
      });

      client.on("user-left", () => {
        setRemoteUserJoined(false);
        setRemoteVideoActive(false);
      });

      await client.join(AGORA_APP_ID, videoRoom, null, userId?.toString());

      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks(tracks);
      
      if (tracks[1]) tracks[1].play("localVideo");

      await client.publish(tracks);
    } catch (e) {
      console.error("Agora init failed", e);
    }
  };

  const leaveAgora = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (localTracks.length > 0) {
      localTracks.forEach(track => {
        track.stop();
        track.close();
      });
      setLocalTracks([]);
    }
    if (agoraClient) {
      await agoraClient.leave();
      setAgoraClient(null);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !actualRoomId) return;

    const role = localStorage.getItem("role");
    socket.emit("send_message", {
      room: actualRoomId,
      consultation_id: sessionId,
      sender_id: userId,
      sender_role: role,
      message: newMessage
    });

    setNewMessage('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    if (track) {
      const nextIsOff = !isVideoOff;
      track.enabled = !nextIsOff;
      setIsVideoOff(nextIsOff);
      if (localTracks[1]) localTracks[1].setEnabled(!nextIsOff);
    }
  };

  const toggleMic = () => {
    if (cameraStream) {
      const audioTrack = cameraStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
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
      setUploadedFile(file.name);
      setTimeout(() => setUploadedFile(null), 4000);
    } catch (error) {
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEndCall = () => {
    setShowEndCallModal(true);
  };

  const onConfirmEndCall = () => {
    leaveAgora();
    navigate('/upcoming-appointments');
  };

  return (
    <ScreenContainer noScroll className="bg-gray-900">
      <div className="relative h-full w-full min-h-[600px]">
        {/* Remote Video Overlay */}
        <div id="remoteVideo" className="absolute inset-0 bg-gray-800 flex items-center justify-center">
             {(!remoteUserJoined || !remoteVideoActive || isWaiting) && (
               <div className="text-center z-10">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <VideoOff size={48} className="text-white/20" />
                  </div>
                  <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-sm">
                    {isWaiting ? "Doctor will join soon" : 
                     !remoteUserJoined ? "Waiting for Doctor..." : "Participant camera is off"}
                  </p>
               </div>
             )}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-8 bg-gradient-to-b from-black/60 to-transparent z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-medium">{formatDuration(callDuration)}</span>
            <span className="flex-1 text-center font-bold">
              {appointment?.doctor_name || 'Loading...'}
            </span>
            <span className="text-[8px] text-white/40 font-bold uppercase">Room: {actualRoomId?.slice(0, 8)}</span>
          </div>
        </div>

        {/* Self View (Local) */}
        <div className="absolute top-20 right-4 w-28 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg z-10">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover" />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-20">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-2">
                <VideoOff size={16} className="text-white/40" />
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase">Off</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 z-20">
            {isMuted && <MicOff size={14} className="text-red-500" />}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 px-6 z-20">
          <div className="flex items-center justify-between max-w-xs mx-auto">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full ${isMuted ? 'bg-white text-gray-900' : 'bg-white/20 text-white backdrop-blur-md'}`}>
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full ${isVideoOff ? 'bg-white text-gray-900' : 'bg-white/20 text-white backdrop-blur-md'}`}>
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>

            <button
              onClick={handleEndCall}
              className="p-5 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all">
              <PhoneOff size={28} />
            </button>

            <button
              onClick={() => setShowChat(true)}
              className="p-4 rounded-full bg-white/20 text-white backdrop-blur-md relative">
              <MessageSquare size={24} />
              {hasNewMessage && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-full bg-white/20 text-white backdrop-blur-md">
              <Upload size={24} />
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat &&
        <div className="absolute inset-0 bg-black/50 z-30 flex flex-col justify-end animate-fade-in">
            <div className="bg-white rounded-t-3xl h-2/3 flex flex-col animate-slide-up">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-text-primary">Consultation Chat</h3>
                <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.user_id == userId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${msg.user_id == userId ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-text-primary'} rounded-2xl p-3 max-w-[80%] text-sm shadow-sm`}>
                        <div className="flex justify-between items-center gap-4 mb-1">
                            <span className="text-[10px] font-bold uppercase opacity-70">{msg.role}</span>
                            <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                        </div>
                        {msg.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-text-secondary italic">
                    Start chatting with your doctor...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 h-12 px-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20" />

                <button 
                  onClick={handleSendMessage}
                  className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        }

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={handleFileUpload} />
      </div>

      <Modal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        title="End Call"
        description="Are you sure you want to end this consultation?"
        confirmText="End Call"
        cancelText="Continue"
        onConfirm={onConfirmEndCall}
        variant="danger" />

    </ScreenContainer>
  );
}