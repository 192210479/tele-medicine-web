import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface DoctorInfo {
  name: string;
  specialization: string;
}

export default function PrescriptionReadyScreen() {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: {
      appointment_id: number;
      doctor?: DoctorInfo;
    };
  };

  // Seed from navigation state if the waiting screen already loaded it
  const [doctor, setDoctor] = useState<DoctorInfo | null>(state?.doctor || null);

  useEffect(() => {
    if (!state?.appointment_id) {
      navigate("/upcoming-appointments", { replace: true });
      return;
    }

    // Only fetch if doctor info wasn't passed from waiting screen
    if (doctor) return;

    async function loadDoctorInfo() {
      try {
        const detailRes = await fetch(
          `/api/consultation/details/${state.appointment_id}`
        );
        if (!detailRes.ok) return;
        const detail = await detailRes.json();
        if (!detail.doctor_id) return;

        const profileRes = await fetch(
          `/api/profile?user_id=${detail.doctor_id}&role=doctor`
        );
        if (!profileRes.ok) return;
        const profile = await profileRes.json();

        setDoctor({
          name: profile.full_name || "Your Doctor",
          specialization: profile.specialization || "Specialist",
        });
      } catch { /* silent */ }
    }

    loadDoctorInfo();
  }, [state?.appointment_id]); // eslint-disable-line

  function handleViewPrescription() {
    navigate("/consultation/prescription-view", {
      state: { appointment_id: state.appointment_id },
    });
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center px-6">

      {/* Success icon */}
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Prescription Ready!
      </h1>
      <p className="text-gray-500 text-sm mb-10 text-center">
        Your doctor has completed your prescription
      </p>

      {/* Doctor card — real data from API */}
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {doctor ? `Dr. ${doctor.name}` : "Your Doctor"}
            </p>
            <p className="text-gray-400 text-xs">
              {doctor ? doctor.specialization : "Specialist"}
            </p>
          </div>
        </div>
        <p className="text-blue-500 text-sm text-center">
          Your prescription is ready to view
        </p>
      </div>

      {/* Bottom action buttons */}
      <div className="w-full px-6 pb-8 pt-8 mt-auto flex justify-center">
        <div className="w-full max-w-md">
          <button
            onClick={handleViewPrescription}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Prescription
          </button>
          <button
            onClick={() => navigate("/upcoming-appointments", { replace: true })}
            className="w-full text-center text-gray-400 text-sm mt-3 hover:text-gray-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

    </div>
  );
}
