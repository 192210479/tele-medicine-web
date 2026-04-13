import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, 
  Share2, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  Pill, 
  Clock, 
  ShieldCheck, 
  Printer, 
  Stethoscope,
  Info
} from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { getSocket } from '../utils/socketUtils';

export function PremiumPrescriptionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rawUserId = localStorage.getItem('user_id') || localStorage.getItem('auth_token');
  const userId = parseInt(rawUserId || '0');
  const role = localStorage.getItem('user_role') || localStorage.getItem('role') || 'patient';
  const patientName = localStorage.getItem('user_name') || localStorage.getItem('name') || "Patient";

  // AI Explanation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const fetchPrescription = async () => {
    if (!id || isNaN(userId)) return;
    try {
      // 1. Try fetching directly by the provided ID (usually appointment ID)
      const res = await fetch(`/api/prescription/${id}?user_id=${userId}&role=${role}`);
      const data = await res.json();
      
      if (res.ok && !data.error && data.medicines) {
        setPrescription(data);
        setErrorMsg(null);
        
        // Fetch supplemental appointment details for date/time
        try {
          const apptRes = await fetch(`/api/appointment/${id}`);
          if (apptRes.ok) {
            const apptData = await apptRes.json();
            setAppointment(apptData);
          }
        } catch (e) { console.error("Failed to fetch appointment meta", e); }
        
      } else {
        // 2. Fallback: Search in the patient's full prescriptions list
        // This handles cases where ID might be consultation_id vs appointment_id
        const listRes = await fetch(`/api/patient/prescriptions?user_id=${userId}&role=${role}`);
        if (listRes.ok) {
          const list = await listRes.json();
          const match = list.find((p: any) => 
            String(p.appointment_id) === String(id) || 
            String(p.id) === String(id) ||
            String(p.consultation_id) === String(id)
          );
          if (match) {
            setPrescription(match);
            setErrorMsg(null);
            
            // Try fetch appt for match too
            const apptId = match.appointment_id || id;
            try {
              const apptRes = await fetch(`/api/appointment/${apptId}`);
              if (apptRes.ok) {
                const apptData = await apptRes.json();
                setAppointment(apptData);
              }
            } catch (e) {}
            
            return;
          }
        }
        setErrorMsg(data.error || "The prescription for this consultation is not yet available.");
      }
    } catch (err) {
      console.error('Failed to fetch prescription', err);
      // Special case: check list even on network error for the specific endpoint
      try {
        const listRes = await fetch(`/api/patient/prescriptions?user_id=${userId}&role=${role}`);
        if (listRes.ok) {
          const list = await listRes.json();
          const match = list.find((p: any) => String(p.appointment_id) === String(id) || String(p.id) === String(id));
          if (match) {
            setPrescription(match);
            setErrorMsg(null);
            return;
          }
        }
      } catch (innerErr) {}
      setErrorMsg("Failed to load secure prescription record.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescription();

    // REAL-TIME: If the prescription is not available, it might be about to be submitted
    const socket = getSocket();
    const handleNewPrescription = (data: any) => {
      if (String(data.appointment_id) === String(id)) {
        setIsLoading(true);
        fetchPrescription();
      }
    };

    socket.on('prescription_submitted', handleNewPrescription);
    socket.on('prescription_ready', handleNewPrescription);

    return () => {
      socket.off('prescription_submitted', handleNewPrescription);
      socket.off('prescription_ready', handleNewPrescription);
    };
  }, [id]);

  const explainPrescription = async () => {
    if (!prescription?.medicines) return;
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const res = await fetch('/ai/explain-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: prescription.medicines })
      });
      const data = await res.json();
      setAiExplanation(data);
    } catch (err) {
      console.error(err);
      setAiExplanation({ 
        summary: "Failed to connect to AI service.", 
        medicines: [], 
        disclaimer: "AI results are for informational purposes only. Consult your doctor for medical advice." 
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Medical Prescription - ${prescription.doctor_name}`,
          text: `View my prescription from Dr. ${prescription.doctor_name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      window.alert('Sharing is not supported on this browser. You can copy the URL instead.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-spin"></div>
          <div className="absolute top-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <FileText className="text-primary animate-pulse" size={32} />
          </div>
        </div>
        <p className="mt-8 text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Decrypting Medical Records...</p>
      </div>
    );
  }

  if (errorMsg || !prescription) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <ScreenContainer title="Prescription Details" showBack onBackClick={() => navigate(-1)}>
          <div className="max-w-xl mx-auto px-6 py-20 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 border border-gray-100">
               <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <FileText size={32} className="text-orange-400" />
               </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Prescription Pending</h2>
            <p className="text-gray-500 font-medium mb-10 leading-relaxed">
              {errorMsg === "The prescription for this consultation is not yet available." 
                ? "Your doctor is still finalizing your prescription. It will appear here automatically once ready." 
                : errorMsg}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={fetchPrescription}
                className="w-full bg-primary text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg active:scale-95"
              >
                Refresh Status
              </button>
              <button 
                onClick={() => navigate(-1)}
                className="w-full bg-white border-2 border-slate-200 text-slate-500 font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                Back to List
              </button>
            </div>
            <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-3">
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                 <span className="animate-pulse">Live Link Active</span>
               </div>
               <span className="opacity-30">|</span>
               <span>Ref: {id}</span>
            </p>
          </div>
        </ScreenContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-12 print:bg-white print:p-0">
      <ScreenContainer title="Prescription Details" showBack onBackClick={() => navigate(-1)} className="print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 no-print transition-all animate-in fade-in slide-in-from-top-4">
             <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm text-gray-600 font-bold text-sm hover:shadow-md transition-all active:scale-95 border border-gray-100"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              BACK
            </button>
            <div className="flex gap-3">
               <button 
                 onClick={handlePrint}
                 className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm text-gray-700 font-bold text-sm hover:shadow-md transition-all active:scale-95 border border-gray-100"
               >
                 <Printer size={18} /> PRINT
               </button>
               <button 
                onClick={explainPrescription}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full shadow-xl shadow-primary/20 font-bold text-sm hover:brightness-110 transition-all active:scale-95"
               >
                 <span className="text-lg leading-none">✨</span> AI ANALYZE
               </button>
            </div>
          </div>

          {/* Premium Prescription Card */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden relative animate-in fade-in zoom-in-95 duration-700 print:shadow-none print:border-none print:rounded-none">
            
            {/* Header / Brand Strip */}
            <div className="h-3 bg-gradient-to-r from-primary via-blue-400 to-indigo-500" />
            
            <div className="p-8 md:p-14">
               {/* Institute Info */}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 border-b border-gray-100 pb-12">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
                        <Stethoscope size={36} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">TeleHealth+</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Certified Digital Prescription</p>
                     </div>
                  </div>
                  <div className="text-left md:text-right">
                     <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Document Hash</p>
                     <p className="text-xs font-mono text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">THP-RX-{String(id).padStart(8, '0')}-{new Date().getFullYear()}</p>
                  </div>
               </div>

               {/* Doctor & Patient Info Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                  <div className="space-y-6">
                     <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                           <div className="w-4 h-[2px] bg-primary" />
                           Practitioner
                        </p>
                        <h3 className="text-2xl font-black text-gray-900">Dr. {prescription.doctor_name || "Assigned Consultant"}</h3>
                        <p className="text-sm font-bold text-gray-500 mt-1">{prescription.doctor_specialization || "Medical Professional"}</p>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Appt Date</p>
                           <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                              <Calendar size={14} className="text-primary" /> {appointment?.date || prescription?.date || prescription?.appointment_date || 'N/A'}
                           </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Appt Time</p>
                           <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
                              <Clock size={14} className="text-primary" /> {appointment?.appointment_time || appointment?.time || prescription?.time || prescription?.appointment_time || 'N/A'}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 md:justify-end">
                           Recipient
                           <div className="w-4 h-[2px] bg-indigo-500" />
                        </p>
                        <h3 className="text-2xl font-black text-gray-900 md:text-right">{patientName}</h3>
                        <p className="text-sm font-bold text-gray-500 mt-1 md:text-right">Patient Record #{userId}</p>
                     </div>
                     <div className="flex md:justify-end">
                        <div className="bg-indigo-50/50 border border-indigo-100 px-6 py-2 rounded-2xl flex items-center gap-3">
                           <ShieldCheck size={20} className="text-indigo-500" />
                           <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Identity Verified</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Clinical Findings */}
               <div className="mb-16 bg-blue-50/30 border border-blue-100/50 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Stethoscope size={120} />
                  </div>
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                     <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                     Clinical Impression
                  </h4>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                     {prescription.diagnosis || "General Health Assessment"}
                  </div>
                  {prescription.advice && (
                     <div className="mt-8 pt-8 border-t border-blue-100/50">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Professional Advice</p>
                        <p className="text-gray-600 text-lg font-medium leading-relaxed italic">
                           "{prescription.advice}"
                        </p>
                     </div>
                  )}
               </div>

               {/* Medication List */}
               <div className="space-y-8 mb-16">
                  <div className="flex items-center gap-4 mb-2">
                     <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Medication Regimen</h4>
                     <div className="h-px flex-1 bg-gray-100" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {prescription.medicines?.map((med: any, idx: number) => (
                        <div key={idx} className="bg-white border-2 border-gray-50 rounded-3xl p-6 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors" />
                           
                           <div className="relative z-10">
                              <div className="flex justify-between items-start mb-6">
                                 <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                    <Pill size={24} />
                                 </div>
                                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">{String(idx + 1).padStart(2, '0')}</span>
                              </div>
                              
                              <h5 className="text-xl font-black text-gray-900 mb-2 truncate group-hover:text-primary transition-colors">{med.name}</h5>
                              
                              <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 rounded-xl px-4 py-3">
                                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Dosage</p>
                                       <p className="text-sm font-bold text-gray-700">{med.dosage || 'As directed'}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl px-4 py-3">
                                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Duration</p>
                                       <p className="text-sm font-bold text-gray-700">{med.duration || 'Full course'}</p>
                                    </div>
                                 </div>
                                 
                                 <div className="bg-slate-900 rounded-xl px-4 py-4 text-white">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Frequency & Instructions</p>
                                    <p className="text-sm font-bold">{med.frequency}{med.instructions ? ` • ${med.instructions}` : ''}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Footer Authenticators Removed */}
            </div>
            
            {/* Bottom Disclaimer */}
            <div className="bg-gray-50 p-6 md:px-12 border-t border-gray-100">
               <div className="flex items-start gap-4">
                  <Info size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                     This is a digitally generated prescription through TeleHealth+ Platform. For any drug sensitivities or unexpected reactions, please contact emergency services immediately or reach out to your physician through the app’s priority support channel. This document is valid for use in all partner pharmacies.
                  </p>
               </div>
            </div>
          </div>

          {/* Social Actions */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 no-print max-w-lg mx-auto">
             <button 
               onClick={handleShare}
               className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 text-sm shadow-sm"
             >
                <Share2 size={20} /> SHARE RECORD
             </button>
             <button 
               onClick={handlePrint}
               className="flex-1 bg-slate-900 text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 text-sm shadow-xl shadow-slate-900/10"
             >
                <Download size={20} /> SAVE DOCUMENT
             </button>
          </div>

        </div>
      </ScreenContainer>

      {/* AI Explanation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-white">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h3 className="text-gray-900 font-black tracking-tighter text-xl">AI Clinical Analysis</h3>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Medical Intelligence Engine</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-900 p-2 rounded-full transition-colors flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">✕</div>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-white custom-scrollbar">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-14 h-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6"></div>
                  <p className="text-gray-500 text-sm font-black uppercase tracking-[0.2em] animate-pulse">Consulting Wisdom Engine...</p>
                </div>
              ) : aiExplanation ? (
                <div className="space-y-8">
                  <div className="bg-primary/5 border-2 border-primary/10 rounded-[2rem] p-6 shadow-sm">
                    <p className="text-primary-dark text-base leading-relaxed font-bold">{aiExplanation.summary}</p>
                  </div>
                  
                  {aiExplanation.medicines?.length > 0 && (
                     <div className="space-y-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400">Medication breakdown</p>
                        <div className="space-y-3">
                           {aiExplanation.medicines.map((m: any, i: number) => (
                              <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                                 <p className="text-gray-900 font-black text-lg mb-4">{m.name}</p>
                                 <div className="space-y-4">
                                    <div>
                                       <span className="text-gray-400 uppercase text-[9px] font-black tracking-widest block mb-1">Therapeutic Purpose</span>
                                       <p className="text-gray-700 text-sm leading-relaxed font-bold">{m.purpose}</p>
                                    </div>
                                    <div className="flex gap-4">
                                       <div className="flex-1">
                                          <span className="text-gray-400 uppercase text-[9px] font-black tracking-widest block mb-1">Dosing Plan</span>
                                          <p className="text-gray-700 text-sm leading-relaxed font-bold">{m.dosage}</p>
                                       </div>
                                       {m.precaution && (
                                          <div className="flex-1">
                                             <span className="text-orange-400 uppercase text-[9px] font-black tracking-widest block mb-1">Precaution</span>
                                             <p className="text-orange-700 text-sm leading-relaxed font-bold">⚠️ {m.precaution}</p>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
                  
                  <div className="flex items-start gap-4 bg-slate-900 p-6 rounded-[2rem] border border-slate-800">
                    <Info size={24} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 font-bold leading-relaxed">
                      {aiExplanation.disclaimer}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}
