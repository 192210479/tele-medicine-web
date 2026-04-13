import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Share2, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';

export function PrescriptionScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Explanation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Medical Prescription - ${prescription.doctor_name}`,
          text: `View prescription from Dr. ${prescription.doctor_name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      window.alert('Sharing is not supported on this browser.');
    }
  };

  // User details fallback
  const patientName = localStorage.getItem('user_name') || localStorage.getItem('name') || "Patient";

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
      setAiExplanation({ summary: "Failed to connect to AI service.", medicines: [], disclaimer: "" });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchPrescription = async () => {
      const userId = localStorage.getItem('auth_token') || localStorage.getItem('user_id');
      const role = localStorage.getItem('user_role') || localStorage.getItem('role') || 'patient';
      try {
        const res = await fetch(`/api/prescription/${id}?user_id=${userId}&role=${role}`);
        if (res.ok) {
          const data = await res.json();
          setPrescription(data);
        } else {
          setErrorMsg("The prescription for this consultation is not yet available.");
        }
      } catch (err) {
        console.error('Failed to fetch prescription', err);
        setErrorMsg("Failed to load secure prescription record.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrescription();
  }, [id]);

  return (
    <>
    <div className="min-h-screen bg-[#F5F7FB]">
      <ScreenContainer title="View Prescription" showBack onBackClick={() => navigate(-1)}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary mb-6 hover:underline font-bold transition-all hover:gap-3"
          >
            <ArrowLeft size={20} strokeWidth={3} />
            BACK TO HISTORY
          </button>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-white rounded-3xl shadow-soft">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Fetching secure prescription record...</p>
            </div>
          ) : errorMsg || !prescription ? (
            <div className="text-center py-32 bg-white rounded-3xl shadow-soft">
              <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <FileText size={40} className="text-orange-400" />
              </div>
              <h2 className="text-gray-900 font-black text-2xl mb-2">Prescription Unavailable</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">{errorMsg || "No record found."}</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Watermark Removed */}

              {/* Official Document Header */}
              <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-700/50 to-transparent pointer-events-none" />
                 <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                    <div>
                       <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">{prescription.doctor_name || "Consulting Doctor"}</h1>
                       <div className="inline-block bg-primary/20 text-primary-light px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border border-primary/30">
                          {prescription.doctor_specialization || "Consulting Physician"}
                       </div>
                    </div>
                    <div className="text-left md:text-right">
                       <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Official Prescription</p>
                       <p className="text-xl font-bold tracking-tight">Ref: #{String(id).padStart(6, '0')}</p>
                    </div>
                 </div>
              </div>

              {/* Patient Info Strip */}
              <div className="bg-primary/5 border-b border-primary/10 p-6 md:px-12 flex flex-col md:flex-row justify-between gap-4">
                 <div>
                    <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-1">Patient Name</p>
                    <p className="text-xl font-bold text-gray-900">{patientName}</p>
                 </div>
                 <div>
                    <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-1">Consultation ID</p>
                    <p className="text-lg font-bold text-gray-800 flex items-center gap-2">
                       <Calendar size={18} className="text-primary" /> #{id}
                    </p>
                 </div>
              </div>

              {/* Core Prescription Content */}
              <div className="p-8 md:p-12 space-y-12 relative z-10">
                
                {/* Diagnosis Section */}
                <div className="relative">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                     <span className="w-8 h-[1px] bg-gray-200 block"></span>
                     Primary Diagnosis
                  </h3>
                  <div className="pl-11 text-2xl font-medium text-gray-900 leading-relaxed capitalize">
                     {prescription.diagnosis || 'General Consultation'}
                  </div>
                </div>

                {/* Medicines List */}
                {prescription.medicines && prescription.medicines.length > 0 && (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6 pl-0 md:pl-11">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                         <span className="w-8 h-[1px] bg-gray-200 block md:-ml-11"></span>
                         Prescribed Medication
                      </h3>
                      <button 
                        onClick={explainPrescription}
                        className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-400 rounded-full text-blue-600 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm">
                        <span className="text-lg leading-none">✨</span>
                        AI Explain
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 md:pl-11">
                      {prescription.medicines.map((med: any, i: number) => (
                        <div key={i} className="group relative border border-gray-100 rounded-2xl p-6 bg-white hover:border-primary/30 hover:shadow-lg transition-all">
                          <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                            {i + 1}
                          </div>
                          <div className="mb-4">
                            <h4 className="font-black text-xl text-gray-900 tracking-tight leading-none mb-2">{med.name}</h4>
                            <span className="inline-block bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
                               {med.duration || 'As Needed'}
                            </span>
                          </div>
                          <div className="space-y-1 mb-4">
                             <p className="text-gray-600 font-bold flex justify-between">
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Dosage:</span> {med.dosage}
                             </p>
                             <p className="text-gray-600 font-bold flex justify-between">
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Frequency:</span> {med.frequency}
                             </p>
                          </div>
                          {med.instructions && (
                            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mt-4">
                              <p className="text-amber-800 text-sm font-semibold flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">※</span> {med.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Advice */}
                {prescription.advice && (
                  <div className="relative bg-blue-50/50 p-8 rounded-3xl border border-blue-50">
                    <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                       <FileText size={18} />
                       Physician's Notes
                    </h3>
                    <p className="text-gray-700 text-lg font-medium leading-relaxed italic">
                       "{prescription.advice}"
                    </p>
                  </div>
                )}
                
                {/* Footer Sign-off & Actions */}
                <div className="pt-8 mt-12 border-t border-gray-100">
                  <div className="flex justify-between items-end opacity-50 grayscale mb-10">
                     <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">Digitally Signed By</p>
                        <p className="text-xl font-serif text-gray-900">{prescription.doctor_name || "Consulting Doctor"}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">TeleHealth+ Verified</p>
                     </div>
                  </div>
                  
                  {/* Action Buttons for Patient */}
                  <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 pt-6 no-print">
                    <button 
                      onClick={handleShare}
                      className="flex-1 w-full bg-white border-2 border-primary text-primary font-black uppercase tracking-wider text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-all">
                      <Share2 size={18} /> Share Record
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="flex-1 w-full bg-primary text-white font-black uppercase tracking-wider text-sm py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                      <Download size={18} /> Download PDF
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </ScreenContainer>

      {/* AI Explanation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h3 className="text-gray-900 font-black tracking-tight">AI Prescription Guide</h3>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Simplified Medicine Instructions</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-[#F8FAFC]">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-[4px] border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 text-sm font-bold tracking-wide animate-pulse">Translating medical terminology...</p>
                </div>
              ) : aiExplanation ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-blue-900 text-sm leading-relaxed font-medium">{aiExplanation.summary}</p>
                  </div>
                  
                  {aiExplanation.medicines?.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] font-black text-gray-400">Medication Details</p>
                      <div className="space-y-3">
                        {aiExplanation.medicines.map((m: any, i: number) => (
                          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400"></div>
                            <p className="text-gray-900 font-black text-base mb-3">{m.name}</p>
                            <div className="grid grid-cols-1 gap-3">
                              <p className="text-gray-700 text-sm leading-relaxed font-medium">
                                <span className="text-gray-400 uppercase text-[10px] font-black tracking-widest block mb-1">Purpose</span> {m.purpose}
                              </p>
                              <div className="h-[1px] w-full bg-gray-50"></div>
                              <p className="text-gray-700 text-sm leading-relaxed font-medium flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">Dosage</span> {m.dosage}
                              </p>
                              {m.precaution && (
                                <>
                                  <div className="h-[1px] w-full bg-gray-50"></div>
                                  <p className="text-amber-800 text-sm leading-relaxed font-semibold bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    <span className="text-amber-500 mr-2">⚠️</span>{m.precaution}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 bg-gray-100 p-4 rounded-2xl border border-gray-200">
                    <span className="text-gray-400 mt-0.5 shrink-0 text-lg">ℹ️</span>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                      {aiExplanation.disclaimer}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
    <style>{`
      @media print {
        .no-print { display: none !important; }
        .bg-[#F5F7FB] { background: white !important; }
        .shadow-xl { box-shadow: none !important; }
        .rounded-[2rem] { border-radius: 0 !important; }
        button { display: none !important; }
      }
    `}</style>
    </>
  );
}
