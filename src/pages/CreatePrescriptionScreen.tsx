import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSocket } from "../utils/socketUtils";

interface Medicine {
  name: string; dosage: string; frequency: string;
  duration: string; instructions: string;
}

export default function CreatePrescriptionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { consultation_id: number; appointment_id: number; patient_id: number; patient_name?: string };

  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addMedicine = () => {
    setMedicines(p => [...p, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedicine = (idx: number) => {
    setMedicines(p => p.filter((_, i) => i !== idx));
  };

  const updateMedicine = (idx: number, field: keyof Medicine, value: string) => {
    setMedicines(p => p.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) { setError("Diagnosis is required."); return; }
    if (medicines.some(m => !m.name.trim())) { setError("Each medicine needs a name."); return; }
    if (!state?.consultation_id) { setError("Missing consultation ID. Please go back."); return; }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/prescription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId: state.consultation_id,
          diagnosis: diagnosis.trim(),
          advice: advice.trim(),
          medicines: medicines.filter(m => m.name.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create prescription");

      // REAL-TIME: Notify patient that prescription is ready
      const socket = getSocket();
      socket.emit("prescription_submitted", {
        appointment_id: state.appointment_id,
        prescription_id: data.prescription_id || data.id
      });

      navigate("/consultation/prescription-done", {
        state: {
          appointment_id: state.appointment_id || data.appointment_id,
          consultation_id: state.consultation_id,
        },
        replace: true,
      });
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-gray-700">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-semibold text-sm">Create Prescription</h1>
          <p className="text-gray-400 text-xs">Fill out and send to patient</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto flex-grow w-full">
        {/* Diagnosis */}
        <div>
          <label className="text-gray-300 text-sm font-medium mb-2 block">
            Diagnosis <span className="text-red-400">*</span>
          </label>
          <textarea
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute upper respiratory tract infection..."
            rows={3}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none resize-none placeholder-gray-500"
          />
        </div>

        {/* Advice */}
        <div>
          <label className="text-gray-300 text-sm font-medium mb-2 block">Advice / Notes</label>
          <textarea
            value={advice}
            onChange={e => setAdvice(e.target.value)}
            placeholder="e.g. Rest, drink plenty of fluids, avoid cold drinks..."
            rows={2}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none resize-none placeholder-gray-500"
          />
        </div>

        {/* Medicines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-gray-300 text-sm font-medium">Medicines</label>
            <button
              onClick={addMedicine}
              className="text-blue-400 text-sm hover:text-blue-300 font-medium"
            >
              + Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {medicines.map((med, idx) => (
              <div key={idx} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Medicine #{idx + 1}
                  </span>
                  {medicines.length > 1 && (
                    <button
                      onClick={() => removeMedicine(idx)}
                      className="text-red-400 text-xs hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={med.name}
                    onChange={e => updateMedicine(idx, "name", e.target.value)}
                    placeholder="Medicine name *"
                    className="col-span-2 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                  />
                  <input
                    value={med.dosage}
                    onChange={e => updateMedicine(idx, "dosage", e.target.value)}
                    placeholder="Dosage (e.g. 500mg)"
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                  />
                  <input
                    value={med.frequency}
                    onChange={e => updateMedicine(idx, "frequency", e.target.value)}
                    placeholder="Frequency (e.g. 2x daily)"
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                  />
                  <input
                    value={med.duration}
                    onChange={e => updateMedicine(idx, "duration", e.target.value)}
                    placeholder="Duration (e.g. 5 days)"
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                  />
                  <input
                    value={med.instructions}
                    onChange={e => updateMedicine(idx, "instructions", e.target.value)}
                    placeholder="Instructions (optional)"
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Send Button */}
      <div className="max-w-2xl mx-auto w-full px-4 py-6 mt-auto">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full max-w-2xl mx-auto block bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-colors text-sm"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending Prescription...
            </span>
          ) : "✓ Send Prescription to Patient"}
        </button>
      </div>
    </div>
  );
}
