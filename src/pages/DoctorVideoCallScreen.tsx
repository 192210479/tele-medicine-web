import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Upload,
  Send,
  X,
  Wifi,
  Download,
  Eye,
  AlertCircle} from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useConsultation } from '../hooks/useConsultation';
import { useAgoraClient } from '../hooks/useAgoraClient';
import { getSocket } from '../utils/socketUtils';

export function DoctorVideoCallScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: authId } = useAuth();
  const appointment = location.state?.appointment;
  const userId = authId ?? Number(localStorage.getItem('user_id'));
  const consultationId = appointment?.consultation_id;

  const agora = useAgoraClient();
  const consultation = useConsultation({ 
    appointmentId: appointment?.id, 
    userId, 
    role: 'doctor', 
    consultationId 
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reports' | 'chat'>('info');
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!appointment) {
      navigate('/doctor-dashboard');
    }
  }, [appointment, navigate]);

  // Join Agora when ready
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

  // Emit doctor_ready on mount
  useEffect(() => {
    if (appointment?.id) {
      consultation.emitDoctorReady();
      loadSharedRecords();
    }
  }, [appointment?.id]);

  useEffect(() => {
    if (appointment?.id) {
      const socket = getSocket();
      const handleRecordUpdate = () => {
        loadSharedRecords();
      };
      socket.on('medical_record_shared', handleRecordUpdate);
      socket.on('medical_record_uploaded', handleRecordUpdate);
      return () => {
        socket.off('medical_record_shared', handleRecordUpdate);
        socket.off('medical_record_uploaded', handleRecordUpdate);
      };
    }
  }, [appointment?.id]);

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

  const loadSharedRecords = async () => {
    if (!appointment?.patient_id) return;
    setLoadingRecords(true);
    try {
      const res = await fetch(`/api/medical-records?user_id=${userId}&role=doctor&appointment_id=${appointment.id}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load shared records:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleRequestRecord = async (type: string) => {
    try {
      const res = await fetch('/api/medical-record/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: userId,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          record_type: type
        })
      });
      if (res.ok) {
        alert(`${type} requested from patient`);
      }
    } catch (error) {
      alert('Failed to send request');
    }
  };

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

  const handleEndCall = async () => {
    await agora.leaveChannel();
    consultation.emitEndCall();
    navigate('/prescription/create', { 
      state: { 
        appointment_id: appointment.id,
        consultation_id: appointment.consultation_id || appointment.id,
        patient_id: appointment.patient_id,
        patient_name: appointment.patient_name
      } 
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && appointment) {
       const formData = new FormData();
       formData.append('doctor_id', String(userId));
       formData.append('patient_id', String(appointment.patient_id));
       formData.append('file', file);
       formData.append('record_title', 'Doctor Clinical Note');

       try {
         const res = await fetch('/api/doctor/upload-review-record', {
           method: 'POST',
           body: formData
         });
         if (res.ok) {
           alert('Medical record uploaded and shared with patient');
           loadSharedRecords();
         } else {
           const err = await res.json();
           alert(`Upload failed: ${err.message || 'Unknown error'}`);
         }
       } catch (error) {
         alert('Network error during upload');
       }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!appointment) return null;

  return (
    <ScreenContainer noScroll className="bg-[#0f1115]">
      <div className="relative h-full w-full min-h-[600px] overflow-hidden">
        {/* Remote Video (Patient) */}
        {!agora.joined ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 border-2 border-primary/20 m-6 rounded-[48px] overflow-hidden">
             <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
             <p className="text-primary font-black uppercase tracking-widest text-xs">Waiting for Patient to sync...</p>
             <p className="text-gray-600 text-[10px] mt-2 font-bold uppercase">Encrypted Session #{appointment.id}</p>
          </div>
        ) : (
          <div ref={agora.setRemoteEl} className="w-full h-full bg-black object-cover" />
        )}

        {/* Header Ribbon */}
        <div className="absolute top-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-3xl rounded-[32px] border border-white/10 z-10 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_red]" />
            <span className="font-mono text-white text-base font-black tracking-widest">
              {formatDuration(callDuration)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
               <Wifi size={14} className="text-green-400" />
               <span className="text-[10px] text-green-300 font-black uppercase">LIVE • HD</span>
            </div>
            <button onClick={() => { setShowPanel(true); setActiveTab('chat'); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
               <MessageSquare size={20} />
            </button>
          </div>
        </div>

        {/* Patient Label */}
        <div className="absolute top-28 left-8 z-10">
          <div className="bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-lg min-w-[200px]">
            <h3 className="text-white font-black text-base leading-tight">{appointment.patient_name}</h3>
            <p className="text-white/60 text-[10px] font-bold uppercase mt-1 tracking-widest">Patient Details Attached</p>
            <div className="mt-4 flex gap-2">
               <Badge className="bg-blue-500/20 text-blue-200 border-none text-[8px] font-black uppercase">Fever</Badge>
               <Badge className="bg-orange-500/20 text-orange-200 border-none text-[8px] font-black uppercase">New Case</Badge>
            </div>
          </div>
        </div>

        {/* Doctor Self View (Small) */}
        <div className="absolute top-28 right-8 w-36 h-48 bg-gray-800 rounded-[32px] overflow-hidden border-2 border-white/20 shadow-2xl z-10">
          <div ref={agora.setLocalEl} className="w-full h-full bg-gray-700" />
          {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOff size={24} className="text-white/40" />
              </div>
          )}
          <div className="absolute bottom-3 right-3 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
        </div>

        {/* Controls Dock */}
        <div className="absolute bottom-10 left-0 right-0 px-8 z-20 flex justify-center">
          <div className="bg-black/60 backdrop-blur-3xl rounded-[48px] p-2 border border-white/10 shadow-2xl flex items-center px-6 py-4 gap-6">
            <button
              onClick={toggleMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isMuted ? 'bg-white text-gray-900 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isMuted ? <MicOff size={26} /> : <Mic size={26} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isVideoOff ? 'bg-white text-gray-900 shadow-xl' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {isVideoOff ? <VideoOff size={26} /> : <Video size={26} />}
            </button>

            <button
              onClick={() => setShowEndCallModal(true)}
              className="w-16 h-16 rounded-full bg-[#FF3B30] text-white shadow-[0_12px_24px_rgba(255,59,48,0.4)] flex items-center justify-center hover:bg-red-600 transition-all transform hover:scale-105 mx-2 active:scale-90">
              <PhoneOff size={32} />
            </button>

            <button
              onClick={() => { setShowPanel(true); setActiveTab('reports'); }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${showPanel && activeTab === 'reports' ? 'bg-primary text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              <FileText size={26} />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center active:scale-95">
              <Upload size={26} />
            </button>
          </div>
        </div>

        {/* Side Panel */}
        {showPanel && (
           <div className="absolute inset-y-0 right-0 w-[420px] bg-white shadow-2xl z-30 animate-in slide-in-from-right duration-500 border-l border-gray-100 flex flex-col">
              <div className="px-8 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                   <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Patient Clinical Portal</h3>
                   <p className="text-[10px] font-bold text-gray-400 mt-0.5">ID: {appointment.id} • STATUS: ONGOING</p>
                </div>
                <button onClick={() => setShowPanel(false)} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex bg-white px-8 pt-4">
                {(['info', 'reports', 'chat'] as const).map((tab) =>
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === tab ? 'text-primary border-primary' : 'text-gray-300 border-transparent'}`}>
                    {tab}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                {activeTab === 'info' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section>
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Patient Vitals</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-gray-50 border-none p-4 rounded-2xl">
                             <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Blood Pressure</span>
                             <span className="text-xl font-black text-gray-900">118/72 <span className="text-xs text-green-500 font-bold ml-1">Normal</span></span>
                          </Card>
                          <Card className="bg-gray-50 border-none p-4 rounded-2xl">
                             <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Heart Rate</span>
                             <span className="text-xl font-black text-gray-900">74 <span className="text-[10px] text-gray-400 ml-1">BPM</span></span>
                          </Card>
                       </div>
                    </section>
                    <section>
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Primary Complaint</h4>
                       <div className="p-4 bg-red-50 rounded-2xl border border-red-100 italic text-sm text-red-900 font-medium leading-relaxed">
                          "I've been feeling persistent headaches for the last 3 days, accompanied by slight nausea in the mornings."
                       </div>
                    </section>
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shared Medical Reports</h4>
                        <div className="flex gap-2">
                           <button onClick={() => loadSharedRecords()} className="text-[10px] font-black text-primary uppercase">Refresh</button>
                        </div>
                     </div>

                     {loadingRecords ? (
                       <div className="flex flex-col items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase">Syncing Records...</p>
                       </div>
                     ) : records.length === 0 ? (
                       <div className="bg-gray-50 rounded-3xl p-8 text-center border border-dashed border-gray-200">
                          <AlertCircle size={32} className="text-gray-300 mx-auto mb-3" />
                          <p className="text-xs font-bold text-gray-500">No records shared for this session</p>
                          <div className="mt-6 flex flex-col gap-2">
                             <button onClick={() => handleRequestRecord('Blood Test')} className="text-[10px] font-black text-white bg-primary py-3 rounded-xl uppercase tracking-widest">Request Blood Test</button>
                             <button onClick={() => handleRequestRecord('Medical Report')} className="text-[10px] font-black text-primary border border-primary/20 py-3 rounded-xl uppercase tracking-widest">Request Report</button>
                          </div>
                       </div>
                     ) : (
                       <div className="space-y-3">
                          {records.map(r => (
                            <Card key={r.id} className="p-4 bg-white border border-gray-100 rounded-3xl flex items-center justify-between shadow-sm">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                     <FileText size={18} />
                                  </div>
                                  <div className="max-w-[150px]">
                                     <p className="text-xs font-black text-gray-900 truncate">{r.file_name}</p>
                                     <p className="text-[9px] font-bold text-gray-400 uppercase">{r.record_type}</p>
                                  </div>
                               </div>
                               <div className="flex gap-2">
                                  <a href={`${r.file_url}?user_id=${userId}&role=doctor&view=true`} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors">
                                     <Eye size={16} />
                                  </a>
                                  <a href={`${r.file_url}?user_id=${userId}&role=doctor`} download={r.file_name} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors">
                                     <Download size={16} />
                                  </a>
                               </div>
                            </Card>
                          ))}
                          <div className="pt-4">
                             <button onClick={() => handleRequestRecord('Medical Record')} className="w-full text-[10px] font-black text-gray-400 border border-dashed border-gray-200 py-4 rounded-2xl uppercase tracking-widest hover:border-primary hover:text-primary transition-all">Request More Records</button>
                          </div>
                       </div>
                     )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="flex flex-col h-[calc(100vh-350px)] animate-in fade-in duration-300">
                     <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                        {consultation.messages.map((m: any, i: number) => (
                          <div key={i} className={`flex ${m.senderRole === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-4 max-w-[85%] shadow-sm ${m.senderRole === 'doctor' ? 'bg-primary text-white rounded-2xl rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none'}`}>
                               <p className="text-xs font-medium leading-relaxed">{m.message}</p>
                            </div>
                          </div>
                        ))}
                     </div>
                     <div className="flex gap-2 pt-4 bg-white sticky bottom-0">
                        <input 
                           type="text" 
                           value={newMessage}
                           onChange={e => setNewMessage(e.target.value)}
                           onKeyPress={e => e.key === 'Enter' && sendMessage()}
                           placeholder="Consultation chat..."
                           className="flex-1 bg-gray-50 border border-gray-100 h-12 px-4 rounded-xl text-xs font-bold focus:border-primary outline-none" />
                        <button onClick={sendMessage} className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center active:scale-95 transition-all">
                           <Send size={18} />
                        </button>
                     </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setShowEndCallModal(true)}
                  className="w-full bg-[#1a1c1e] text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-[0.98] transition-all">
                  Finalize & Create Prescription
                </button>
              </div>
           </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange} />
      </div>

      <Modal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        title="End Consultation?"
        description="This will terminate the video session and proceed to complete the medical documentation and prescription."
        confirmText="Finalize Session"
        cancelText="Resume"
        onConfirm={handleEndCall}
        variant="primary" />
    </ScreenContainer>
  );
}
