import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Send,
  X } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Modal } from '../components/ui/Modal';
export function ConsultationScreen() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [consultationDuration, setConsultationDuration] = useState(0);
  // Simulate consultation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setConsultationDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const handleEndCall = () => {
    navigate('/session-summary');
  };
  return (
    <ScreenContainer noScroll className="bg-gray-900">
      {/* Main Video Area (Doctor) */}
      <div className="relative h-full w-full min-h-[600px]">
        <img
          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800&h=1200"
          alt="Doctor Video"
          className="w-full h-full object-cover opacity-90" />


        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-8 bg-gradient-to-b from-black/60 to-transparent z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-medium">
              {formatDuration(consultationDuration)}
            </span>
            <span className="flex-1 text-center font-bold">
              Dr. Sarah Smith
            </span>
            <div className="w-12" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Self View (Patient) */}
        <div className="absolute top-20 right-4 w-28 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg z-10">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=400"
            alt="Patient"
            className="w-full h-full object-cover" />

        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
          <div className="flex items-center justify-between max-w-xs mx-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full ${isMuted ? 'bg-white text-gray-900' : 'bg-white/20 text-white backdrop-blur-md'}`}>

              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-4 rounded-full ${isVideoOff ? 'bg-white text-gray-900' : 'bg-white/20 text-white backdrop-blur-md'}`}>

              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>

            <button
              onClick={() => setShowEndCallModal(true)}
              className="p-5 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transform hover:scale-105 transition-all">

              <PhoneOff size={28} />
            </button>

            <button
              onClick={() => setShowChat(true)}
              className="p-4 rounded-full bg-white/20 text-white backdrop-blur-md relative">

              <MessageSquare size={24} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border border-white/20" />
            </button>

            <button className="p-4 rounded-full bg-white/20 text-white backdrop-blur-md">
              <FileText size={24} />
            </button>
          </div>
        </div>

        {/* Chat Slide-up Panel */}
        {showChat &&
        <div className="absolute inset-0 bg-black/50 z-30 flex flex-col justify-end animate-fade-in">
            <div className="bg-white rounded-t-3xl h-2/3 flex flex-col animate-slide-up">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-text-primary">
                  Chat with Dr. Sarah
                </h3>
                <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 rounded-full">

                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 max-w-[80%] text-sm text-text-primary">
                    Hello! How are you feeling today?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary text-white rounded-2xl rounded-tr-none p-3 max-w-[80%] text-sm">
                    Hi Doctor, I've been having some headaches lately.
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 h-10 px-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20" />

                <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      {/* End Call Confirmation Modal */}
      <Modal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        title="End Consultation"
        description="Are you sure you want to end this consultation? The session summary will be generated."
        confirmText="End Call"
        cancelText="Continue"
        onConfirm={handleEndCall}
        variant="danger" />

    </ScreenContainer>);

}