import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "../utils/auth";

export default function PrescriptionDoneScreen() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { appointment_id: number; consultation_id: number } };
  const auth = getAuth();
  const [rx, setRx] = useState<any>(null);

  useEffect(() => {
    if (!state?.appointment_id || !auth) return;
    fetch(`/api/prescription/${state.appointment_id}?user_id=${auth.user_id}&role=doctor`)
      .then(r => r.json())
      .then(d => { if (!d.error) setRx(d); })
      .catch(() => {});
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-white text-2xl font-bold mb-2">Prescription Sent!</h1>
        <p className="text-gray-400 text-sm mb-8">
          The prescription has been sent to the patient. The consultation is now complete.
        </p>

        {/* Summary */}
        {rx && (
          <div className="bg-gray-800 rounded-2xl p-5 mb-6 text-left border border-gray-700 space-y-3">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Diagnosis</p>
              <p className="text-white text-sm mt-1">{rx.diagnosis}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Medicines Prescribed</p>
              <p className="text-blue-400 text-sm mt-1 font-semibold">
                {rx.medicines?.length || 0} medicine(s)
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/doctor-appointments", { replace: true })}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-colors text-sm"
        >
          Back to Appointments
        </button>
      </div>
    </div>
  );
}
