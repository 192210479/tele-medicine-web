import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Upload,
  X,
  FileCheck,
  Send,
  AlertCircle } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiUpload } from '../services/api';

export function DoctorVideoCallScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAppointmentId(params.get("appointment_id"));
  }, []);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [actualRoomId, setActualRoomId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'reports' | 'chat'>(
    'info'
  );
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [appointment, setAppointment] = useState<any>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState<any[]>([]);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);
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
    
    // Timer Logic
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
      const response = await fetch(`http://localhost:5000/api/consultation/poll/${id}?user_id=${userId}&role=${role}`);
      const data = await response.json();

      if (data.consultation_status === "Pending") {
        setIsWaiting(true);
        startPolling(id);
      } else if (data.consultation_status === "Live") {
        setIsWaiting(false);
        await startConsultationSession(id);
      } else if (data.consultation_status === "Completed") {
        navigate(`/doctor-prescription-creation?appointment_id=${id}`);
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
        const response = await fetch(`http://localhost:5000/api/consultation/poll/${id}?user_id=${userId}&role=${role}`);
        const data = await response.json();
        
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
      const response = await fetch(`http://localhost:5000/api/consultation/start/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role })
      });
      const data = await response.json();
      
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

    newSocket.on("consultation_ended", (data: any) => {
      if (data.appointment_id == id) {
        leaveAgora();
        navigate(`/doctor-prescription-creation?appointment_id=${id}`);
      }
    });

    newSocket.on("receive_message", (msg: any) => {
      setMessages(prev => [...prev, {
        user_id: msg.sender_id,
        role: msg.sender_role,
        message: msg.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      if (!(showPanel && activeTab === 'chat')) setHasNewMessage(true);
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

  const loadAppointmentData = async (id: string) => {
    try {
      const aptData = await apiGet(`/api/appointment/${id}`);
      setAppointment(aptData);

      if (aptData.patient_id) {
        const records = await apiGet(`/api/doctor/patient-records/${aptData.patient_id}`, {
          user_id: userId,
          role: 'doctor'
        });
        setPatientRecords(records);
      }
    } catch (error) {
      console.error("Failed to load call data:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      await apiPut(`/api/consultation/end/${appointmentId}`, {
        user_id: userId,
        role: 'doctor'
      });
      
      if (socket) {
        socket.emit("consultation_ended", { appointment_id: appointmentId });
      }
      
      await leaveAgora();
      navigate(`/doctor-prescription-creation?appointment_id=${appointmentId}`);
    } catch (e) {
      console.error("Failed to end call", e);
      await leaveAgora();
      navigate(`/doctor-prescription-creation?appointment_id=${appointmentId}`);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !actualRoomId) return;

    socket.emit("send_message", {
      room: actualRoomId,
      consultation_id: sessionId,
      sender_id: userId,
      sender_role: 'doctor',
      message: newMessage
    });

    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('user_id', userId?.toString() || '');
      formData.append('role', 'doctor');
      formData.append('file', file);

      await apiUpload('/api/medical-record/upload', formData);
      setUploadedFile(file.name);
      setTimeout(() => setUploadedFile(null), 4000);
    } catch (error) {
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  useEffect(() => {
    if (activeTab === 'chat' && showPanel) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessage(false);
    }
  }, [messages, activeTab, showPanel]);

  return (
    <ScreenContainer noScroll className="bg-gray-900">
      <div className="relative h-full w-full min-h-[600px] overflow-hidden">
        {/* Patient Video (Main) */}
        <div id="remoteVideo" className="absolute inset-0 bg-black flex items-center justify-center">
           {(!remoteUserJoined || !remoteVideoActive) && (
              <div className="text-white/20 flex flex-col items-center z-10">
                 <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <VideoOff size={48} />
                 </div>
                 <p className="font-bold uppercase tracking-[0.3em] text-sm opacity-50">
                    {!remoteUserJoined ? "Waiting for Patient..." : "Participant camera is off"}
                 </p>
              </div>
           )}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 z-10 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-white text-sm font-bold tracking-widest">
              {formatDuration(callDuration)}
            </span>
            <div className="h-4 w-px bg-white/20 mx-2" />
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-tighter">Room: {actualRoomId?.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <span className="text-xs font-bold uppercase">Patient: {appointment?.patient_name || 'Loading...'}</span>
          </div>
        </div>

        {/* Self View (Doctor) */}
        <div className="absolute top-20 right-4 w-32 h-44 bg-gray-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-10 group">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover" />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-20">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                <VideoOff size={20} className="text-white/40" />
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Camera Off</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg" />
        </div>

        {/* Control Panel */}
        <div className="absolute bottom-8 left-4 right-4 z-20 md:max-w-lg md:mx-auto">
          <div className="bg-black/40 backdrop-blur-2xl rounded-[40px] p-3 border border-white/10 shadow-2xl flex items-center justify-between px-6">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full transition-all duration-300 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all duration-300 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>

            <button
              onClick={() => setShowEndCallModal(true)}
              className="p-5 rounded-full bg-red-600 text-white shadow-2xl shadow-red-600/40 hover:bg-red-700 transition-all transform hover:scale-110 active:scale-90 mx-2">
              <PhoneOff size={28} />
            </button>

            <button
               onClick={() => {
                setShowPanel(true);
                setActiveTab('chat');
              }}
              className={`p-4 rounded-full transition-all duration-300 relative ${showPanel && activeTab === 'chat' ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              <MessageSquare size={22} />
              {hasNewMessage && (
                <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                setShowPanel(true);
                setActiveTab('reports');
              }}
              className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300">
              <FileText size={22} />
            </button>
          </div>
        </div>

        {/* Side Panel */}
        {showPanel &&
        <div className="absolute inset-y-0 right-0 w-full sm:w-1/2 md:w-1/3 bg-white shadow-3xl z-30 animate-slide-left flex flex-col border-l border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl font-bold text-gray-900">Case Files</h3>
              <button
              onClick={() => setShowPanel(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex border-b border-gray-100 bg-white">
              {['info', 'reports', 'chat'].map((tab) =>
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-primary border-b-4 border-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                  {tab}
                </button>
            )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'info' &&
                <div className="space-y-6 animate-fade-in text-gray-900">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Symptoms Reported</h4>
                    <p className="text-sm">{appointment?.reason || 'No reason specified'}</p>
                </div>
              }
              {activeTab === 'reports' &&
                <div className="space-y-4 animate-fade-in">
                   {patientRecords.length > 0 ? patientRecords.map((record) => (
                      <Card key={record.id} className="p-4 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                         <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                            <FileCheck size={24} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{record.filename}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{record.date}</p>
                         </div>
                      </Card>
                   )) : (
                      <div className="text-center py-12 opacity-50">
                         <FileText size={48} className="mx-auto text-gray-300 mb-2" />
                         <p className="text-sm font-medium">No records found</p>
                      </div>
                   )}
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-primary hover:text-primary transition-all"
                   >
                     + Upload New File
                   </button>
                </div>
              }
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col animate-fade-in">
                  <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                    {messages.length > 0 ? (
                      messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.user_id == userId ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.user_id == userId ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-800'}`}>
                            <div className="flex justify-between items-center gap-4 mb-1">
                                <span className="text-[10px] font-bold uppercase opacity-70">{msg.role}</span>
                                <span className="text-[10px] opacity-60">{msg.timestamp}</span>
                            </div>
                            {msg.message}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 text-gray-400 italic text-sm">
                        No messages yet.
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 h-12 px-4 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0">
               <button
                 onClick={() => navigate(`/doctor-prescription-creation?appointment_id=${appointmentId}`)}
                 className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all transform active:scale-95 text-base"
               >
                 Draft Prescription
               </button>
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
        
        {uploadedFile &&
          <div className="absolute top-20 left-4 right-4 z-40 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-down">
              <FileCheck size={18} />
              <div className="flex flex-col">
                 <span className="text-xs font-bold uppercase tracking-wider">File Shared</span>
                 <span className="text-sm truncate">{uploadedFile}</span>
              </div>
          </div>
        }
      </div>

      <Modal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        title="Finalize Consultation"
        description="This will terminate the video session and proceed to prescription creation."
        confirmText="End & Prescribe"
        cancelText="Stay on Call"
        onConfirm={handleEndCall}
        variant="primary" />

    </ScreenContainer>
  );
}