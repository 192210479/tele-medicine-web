import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/consultationSocket';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import {
  sortAscending,
  groupByDate,
  dateBadge,
  fmtDate,
  fmtTime
} from '../utils/dateUtils';
import { DoctorAvatar } from '../components/ui/DoctorAvatar';

type ApptItem = {
  id:                  number;
  doctor_id:          number;
  doctor_name:        string;
  specialization:     string | null;
  doctor_image:       string | null;
  date:                string;
  time:                string;
  status:              string;
  consultation_status: string;
};

export function UpcomingAppointmentsScreen() {
  const navigate = useNavigate();
  const { userId: authId } = useAuth();
  const patientId = authId ?? Number(localStorage.getItem("user_id"));

  const [appointments, setAppointments] = useState<ApptItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpcoming = useCallback(() => {
    if (!patientId) return;
    setLoading(true);
    fetch(`/api/my-appointments?user_id=${patientId}&role=patient&status=Scheduled`)
      .then(r => r.json())
      .then((data: ApptItem[]) => {
        const sorted = sortAscending(Array.isArray(data) ? data : []);
        setAppointments(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  useEffect(() => {
    const refresh = () => { if (!document.hidden && patientId) fetchUpcoming(); };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("appointment-booked", fetchUpcoming as EventListener);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("appointment-booked", fetchUpcoming as EventListener);
    };
  }, [patientId, fetchUpcoming]);

  const grouped   = groupByDate(appointments);
  const sortedDates = Object.keys(grouped).sort();

  // ── Badge appearance helper ────────────────────────────────
  function badgeStyle(badge: string) {
    if (badge === "Today")    return "bg-green-50 text-green-600 border border-green-200";
    if (badge === "Tomorrow") return "bg-blue-50 text-blue-500 border border-blue-200";
    return "bg-gray-100 text-gray-500 border border-gray-200";
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <ScreenContainer showBack={false} className="pb-10">

        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Upcoming Appointments</h1>
        </div>

        <div className="w-full px-6 py-6 space-y-4">

          {/* ── Loading ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Loading appointments...</p>
            </div>

          /* ── Empty ── */
          ) : sortedDates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-semibold text-base mb-1">No Upcoming Appointments</p>
                <p className="text-gray-400 text-sm">You don't have any visits scheduled yet.</p>
              </div>
              <button
                onClick={() => navigate('/book-appointment')}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Book an Appointment
              </button>
            </div>

          /* ── Appointment cards ── */
          ) : (
            sortedDates.map(dateKey => (
              grouped[dateKey].map(appt => {
                const badge = dateBadge(appt.date);
                const isToday = badge === "Today";

                return (
                  <div
                    key={appt.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                  >
                    {/* Doctor info row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <DoctorAvatar image={appt.doctor_image} name={appt.doctor_name} size="md" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm leading-snug">
                            {appt.doctor_name}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {appt.specialization ?? "General Care"}
                          </p>
                        </div>
                      </div>

                      {/* Date badge — Today / Tomorrow / Scheduled */}
                      <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${badgeStyle(badge)}`}>
                        {badge === "Today" || badge === "Tomorrow" ? badge : "Scheduled"}
                      </span>
                    </div>

                    {/* Date + time row */}
                    <div className="flex items-center gap-5 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{fmtDate(appt.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{fmtTime(appt.time)}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => navigate(`/appointment/${appt.id}`)}
                        className="flex-1 border border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-colors"
                      >
                        View Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to cancel this appointment? Your refund will be processed automatically.")) {
                            try {
                              // Step 1: Cancel the appointment
                              const cancelRes = await fetch(`/api/appointment/cancel/${appt.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role: 'patient', user_id: patientId })
                              });
                              const cancelData = await cancelRes.json();

                              if (!cancelRes.ok) {
                                alert(cancelData.error || "Could not cancel appointment.");
                                return;
                              }

                              // Step 2: Attempt refund — fetch billing to get payment ID first
                              let refundMsg = "";
                              try {
                                const billingRes = await fetch(`/api/billing/history?patient_id=${patientId}`);
                                if (billingRes.ok) {
                                  const billingData = await billingRes.json();
                                  const txList: any[] = billingData?.billing_history ?? [];
                                  const matched = txList.find((tx: any) => String(tx.appointment_id) === String(appt.id));
                                  if (matched?.razorpay_payment_id && matched?.payment_status === 'success') {
                                    const refundRes = await fetch('/api/payments/refund', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        appointment_id: appt.id,
                                        payment_id: matched.razorpay_payment_id,
                                        amount: matched.total_amount,
                                        patient_id: patientId,
                                        user_id: patientId,
                                        role: 'patient'
                                      })
                                    });
                                    const refundData = await refundRes.json();
                                    if (refundRes.ok) {
                                      refundMsg = `\n✅ Refund of ₹${matched.total_amount} initiated successfully.`;
                                    } else {
                                      refundMsg = `\n⚠️ Refund could not be processed: ${refundData.error || 'Please contact support.'}`;
                                    }
                                  } else if (matched && matched.payment_status !== 'success') {
                                    refundMsg = "\nℹ️ No payment found for this appointment — no refund needed.";
                                  } else {
                                    refundMsg = "\nℹ️ No payment record found for this appointment.";
                                  }
                                }
                              } catch {
                                refundMsg = "\n⚠️ Could not contact payment server. Please check billing manually.";
                              }

                              // Step 3: Notify all pages in real-time
                              window.dispatchEvent(new CustomEvent("appointment-cancelled"));
                              window.dispatchEvent(new CustomEvent("appointment-booked"));
                              socketService.emit('appointment_cancelled', {
                                appointment_id: appt.id,
                                doctor_id: appt.doctor_id,
                                patient_id: patientId
                              });

                              alert(`Appointment cancelled successfully.${refundMsg}`);
                              fetchUpcoming();

                            } catch (e) {
                              alert("An error occurred while communicating with the server.");
                            }
                          }
                        }}
                        className="flex-1 border border-red-500 text-red-600 hover:bg-red-50 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-colors"
                      >
                        Cancel Appt
                      </button>

                      <button
                        onClick={() => {
                          navigate(`/consultation/${appt.id}`, {
                            state: {
                              appointmentId:  appt.id,
                              patientId:      patientId,
                              doctorId:       appt.doctor_id,
                              doctorName:     appt.doctor_name,
                              specialization: appt.specialization,
                              doctorAvatar:   appt.doctor_image,
                              date:           appt.date,
                              time:           appt.time,
                            }
                          });
                        }}
                        className="flex-1 flex-grow-[1.5] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-sm cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Join Video Call
                      </button>
                    </div>
                  </div>
                );
              })
            ))
          )}

        </div>
      </ScreenContainer>
    </div>
  );
}
