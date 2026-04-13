import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "../utils/auth";

interface Medicine {
  name: string; dosage: string; frequency: string;
  duration: string; instructions: string;
}
interface Prescription {
  diagnosis: string; advice: string; status: string;
  doctor_name: string; doctor_specialization: string;
  medicines: Medicine[];
}

export default function PrescriptionViewScreen() {
  const { state } = useLocation() as { state: { appointment_id: number } };
  const navigate = useNavigate();
  const auth = getAuth();
  const [rx, setRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI Explanation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  const explainPrescription = async () => {
    if (!rx?.medicines) return;
    setShowAiModal(true);
    setAiLoading(true);
    try {
      const res = await fetch('/ai/explain-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: rx.medicines })
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
    if (!state?.appointment_id || !auth) {
      navigate("/upcoming-appointments", { replace: true });
      return;
    }
    fetch(`/api/prescription/${state.appointment_id}?user_id=${auth.user_id}&role=patient`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setRx(d); })
      .catch(() => setError("Failed to load prescription"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate("/upcoming-appointments", { replace: true })}
          className="text-blue-400 text-sm">Back to Appointments</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-4 border-b border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold">Your Prescription</h1>
            <p className="text-gray-400 text-xs">
              Dr. {rx?.doctor_name} · {rx?.doctor_specialization}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto flex-grow">
        {/* Diagnosis */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-2">Diagnosis</p>
          <p className="text-white text-sm leading-relaxed">{rx?.diagnosis}</p>
        </div>

        {/* Advice */}
        {rx?.advice && (
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-2">Doctor's Advice</p>
            <p className="text-white text-sm leading-relaxed">{rx.advice}</p>
          </div>
        )}

        {/* Medicines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Prescribed Medicines</p>
            <button
              onClick={explainPrescription}
              className="px-3 py-1 bg-[#1A1A1A] border border-gray-700 hover:border-blue-500 rounded-full text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Explain
            </button>
          </div>
          <div className="space-y-3">
            {rx?.medicines?.map((m, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">{m.name}</p>
                    {m.dosage && <p className="text-blue-400 text-xs mt-0.5">{m.dosage}</p>}
                  </div>
                  <span className="bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded-full">#{i + 1}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {m.frequency && (
                    <div>
                      <p className="text-gray-500 text-xs">Frequency</p>
                      <p className="text-gray-200 text-xs mt-0.5">{m.frequency}</p>
                    </div>
                  )}
                  {m.duration && (
                    <div>
                      <p className="text-gray-500 text-xs">Duration</p>
                      <p className="text-gray-200 text-xs mt-0.5">{m.duration}</p>
                    </div>
                  )}
                  {m.instructions && (
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs">Instructions</p>
                      <p className="text-gray-200 text-xs mt-0.5">{m.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="max-w-2xl mx-auto w-full px-4 py-6 mt-auto">
        <button
          onClick={() => navigate("/upcoming-appointments", { replace: true })}
          className="w-full block bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-colors text-sm"
        >
          Back to Appointments
        </button>
      </div>

      {/* AI Explanation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold tracking-tight">AI Explanation</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-white hover:bg-gray-700 p-1.5 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-[3px] border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 text-sm font-medium tracking-wide">Simplifying medical terminology...</p>
                </div>
              ) : aiExplanation ? (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 shadow-sm">
                    <p className="text-blue-100/90 text-sm leading-relaxed">{aiExplanation.summary}</p>
                  </div>

                  {aiExplanation.medicines?.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Medicines Simplified</p>
                      <div className="space-y-2.5">
                        {aiExplanation.medicines.map((m: any, i: number) => (
                          <div key={i} className="bg-gray-900/50 rounded-xl p-3.5 border border-gray-700 shadow-sm">
                            <p className="text-white font-bold text-sm mb-2.5">{m.name}</p>
                            <div className="grid grid-cols-1 gap-2">
                              <p className="text-gray-300 text-[13px] border-l-2 border-emerald-500/50 pl-2 leading-relaxed font-medium">
                                <span className="text-gray-500 mr-1">Purpose:</span> {m.purpose}
                              </p>
                              <p className="text-gray-300 text-[13px] border-l-2 border-blue-500/50 pl-2 leading-relaxed font-medium">
                                <span className="text-gray-500 mr-1">Take:</span> {m.dosage}
                              </p>
                              {m.precaution && (
                                <p className="text-gray-300 text-[13px] border-l-2 border-amber-500/50 pl-2 leading-relaxed font-medium">
                                  <span className="text-gray-500 mr-1">Note:</span> {m.precaution}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 bg-[#1A1A1A] p-3 rounded-xl border border-gray-800 shadow-sm">
                    <svg className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
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
  );
}
