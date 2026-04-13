import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Video, User, Stethoscope,
  Hash, Activity, CheckCircle, AlertCircle, Timer, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socketUtils';

// ─── Types ──────────────────────────────────────────────────────────────
interface ConsultationDetails {
  consultation_id: number;
  appointment_id: number;
  doctor_id: number;
  patient_id: number;
  video_channel: string;
  session_id: string;
  video_room: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  status: string;
}

interface AppointmentDetails {
  id: number;
  doctor_name?: string;
  patient_name?: string;
  specialization?: string;
  date: string;
  time: string;
  status: string;
  doctor_id?: number;
  patient_id?: number;
  doctor_image?: string | null;
  patient_image?: string | null;
  appointment_type?: string;
  cancelled_by?: string | null;
  consultation_status?: string;
  payment_status?: string;
  amount?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function fmtDate(raw?: string | null) {
  if (!raw) return '—';
  const [y, m, d] = raw.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

function fmtTime(raw?: string | null) {
  if (!raw || raw === 'N/A') return raw ?? '—';
  const [h, min] = raw.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${(h % 12 || 12).toString().padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`;
}

function fmtDateTime(raw?: string | null) {
  if (!raw || raw.trim() === '' || raw === 'null' || raw === 'None') return '—';
  try {
    const clean = raw.replace(' ', 'T');
    const parsed = clean.endsWith('Z') || clean.includes('+') ? clean : clean + 'Z';
    const d = new Date(parsed);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return '—';
  }
}

function statusColor(status?: string) {
  const s = status?.toLowerCase() ?? '';
  if (s === 'completed') return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
  if (s === 'active' || s === 'in_progress') return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
  if (s === 'scheduled') return { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' };
  if (s === 'cancelled') return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
  if (s === 'missed') return { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };
  return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
}

// ─── Info Row ─────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="font-bold text-gray-900 text-base">{value}</p>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────
function Avatar({ img, name, size = 'lg' }: { img?: string | null; name?: string; size?: 'lg' | 'xl' }) {
  const cls = size === 'xl' ? 'w-20 h-20 text-3xl' : 'w-14 h-14 text-xl';
  const avatarUrl = img
    ? (img.startsWith('/api/') || img.startsWith('http') ? img : `/api/profile/image/file/${img}`)
    : null;
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${cls} rounded-2xl object-cover shadow-md ring-4 ring-white`}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  ) : (
    <div className={`${cls} rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-black shadow-md ring-4 ring-white`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">{title}</h3>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export function AppointmentDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // @ts-ignore
  const { role: authRole, userId: authUserId } = useAuth();
  const role = authRole || localStorage.getItem('role') || 'patient';
  const userId = authUserId ?? Number(localStorage.getItem('user_id'));

  const [appt, setAppt] = useState<AppointmentDetails | null>(null);
  const [consult, setConsult] = useState<ConsultationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Share Records Modal State ──
  const [showShareModal, setShowShareModal] = useState(false);
  const [vaultRecords, setVaultRecords] = useState<any[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const fetchDetails = () => {
      setLoading(true);

      const endpoints: any = {
        doctor: `/api/my-appointments?user_id=${userId}&role=doctor`,
        patient: `/api/my-appointments?user_id=${userId}&role=patient`,
        admin: `/api/admin/appointments?role=admin`
      };

      const paymentFetch = role === 'doctor'
        ? fetch(`/api/doctor/transactions?doctor_id=${userId}&limit=50`).then(r => r.ok ? r.json() : { transactions: [] }).catch(() => ({ transactions: [] }))
        : role === 'admin'
          ? fetch(`/api/admin/revenue_trend`).then(r => r.ok ? r.json() : []).catch(() => [])
          : fetch(`/api/billing/history?patient_id=${userId}`).then(r => r.ok ? r.json() : { billing_history: [] }).catch(() => ({ billing_history: [] }));

      Promise.all([
        fetch(endpoints[role] || endpoints.patient).then(r => r.ok ? r.json() : []),
        fetch(`/api/admin/appointments_list`).then(r => r.ok ? r.json() : []).catch(() => []), // Secondary pool for admin
        fetch(`/api/consultation/details/${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
        paymentFetch
      ])
        .then(([appointments, dashboardAppts, consultData, billingData]) => {
          if (!isMounted) return;

          const primaryPool = Array.isArray(appointments) ? appointments : [];
          const secondaryPool = Array.isArray(dashboardAppts) ? dashboardAppts : [];
          const combined = [...primaryPool, ...secondaryPool];

          const found = combined.find((a: AppointmentDetails) => String(a.id) === String(id));

          if (found) {
            // Sync billing data
            if (role === 'admin') {
              // For admin, we assume paid if scheduled/completed/missed as per your rules
              found.payment_status = ['scheduled', 'completed', 'missed'].includes(found.status.toLowerCase()) ? 'Paid' : 'Pending';
            } else {
              const txList = role === 'doctor' ? (billingData?.transactions || []) : (billingData?.billing_history || []);
              const matchedTx = txList.find((tx: any) => String(tx.appointment_id) === String(id));
              if (matchedTx) {
                found.amount = role === 'doctor' ? Math.abs(matchedTx.net_amount || 0) : matchedTx.total_amount;
                found.payment_status = role === 'doctor' ? 'Paid' : matchedTx.payment_status;
              }
            }
            setAppt(found);
          } else {
            setError('This appointment record is not accessible or does not exist.');
          }

          if (consultData && !consultData.error) setConsult(consultData);
        })
        .catch(() => { if (isMounted) setError('Failed to synchronize real-time data.') })
        .finally(() => { if (isMounted) setLoading(false); });
    };

    fetchDetails();

    const socket = getSocket();
    socket.on('payment_success', fetchDetails);

    return () => {
      isMounted = false;
      socket.off('payment_success', fetchDetails);
    };
  }, [id, userId, role]);

  const apptStatus = statusColor(appt?.status);
  const consultStatus = statusColor(consult?.status);
  const isDoctor = role === 'doctor';

  // ── Handlers ──
  const openShareModal = async () => {
    setShowShareModal(true);
    setRecordsLoading(true);
    try {
      const res = await fetch(`/api/medical-records?user_id=${userId}&role=patient`);
      if (res.ok) {
        const data = await res.json();
        setVaultRecords(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecordsLoading(false);
    }
  };

  const toggleSelect = (rid: number) => {
    setSelectedRecords(prev => prev.includes(rid) ? prev.filter(x => x !== rid) : [...prev, rid]);
  };

  const submitShare = async () => {
    if (selectedRecords.length === 0) return;
    setIsSharing(true);
    try {
      const res = await fetch('/api/medical-record/share-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role: 'patient',
          appointment_id: Number(id),
          record_ids: selectedRecords
        })
      });
      if (res.ok) {
        setShowShareModal(false);
        setSelectedRecords([]);
        alert('Records shared successfully!');
      } else {
        alert('Failed to share records.');
      }
    } catch (err) {
      alert('Error sharing records.');
    } finally {
      setIsSharing(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-black text-xs uppercase tracking-widest">Loading Appointment Details...</p>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !appt) return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center">
        <AlertCircle size={40} className="text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="font-black text-2xl text-gray-900 mb-2">Details Unavailable</h2>
        <p className="text-gray-500">{error || 'Could not load this appointment.'}</p>
      </div>
      <button onClick={() => navigate(-1)} className="text-primary font-bold hover:underline flex items-center gap-2">
        <ArrowLeft size={18} /> Go Back
      </button>
    </div>
  );

  const personName = isDoctor ? appt.patient_name : appt.doctor_name;
  const personImg = isDoctor ? appt.patient_image : appt.doctor_image;
  const personSub = isDoctor
    ? `Patient #${appt.patient_id}`
    : (appt.specialization || 'Consulting Physician');

  return (
    <div className="min-h-screen bg-[#F5F7FB]">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-xl text-gray-900 leading-none">Appointment</h1>
          <p className="text-gray-400 text-xs font-bold mt-0.5">#{String(id).padStart(6, '0')}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${apptStatus.bg}`}>
          <span className={`w-2 h-2 rounded-full ${apptStatus.dot} animate-pulse`} />
          <span className={`text-xs font-black uppercase tracking-widest ${apptStatus.text}`}>
            {appt.status}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero Card: Doctor or Patient ── */}
        <div className="bg-slate-900 text-white rounded-[2rem] p-8 relative overflow-hidden shadow-xl">
          {/* BG gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 to-transparent pointer-events-none" />
          {/* Subtle watermark */}
          <div className="absolute bottom-4 right-6 text-[80px] font-black opacity-[0.04] pointer-events-none select-none">
            {isDoctor ? '🩺' : '💊'}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar img={personImg} name={personName} size="xl" />
            <div className="flex-1">
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
                {isDoctor ? 'Patient' : 'Consulting Doctor'}
              </p>
              <h2 className="text-3xl font-black tracking-tight leading-none mb-2">
                {personName || '—'}
              </h2>
              <p className="text-slate-300 font-semibold text-base">{personSub}</p>

              {/* Quick pills */}
              <div className="flex flex-wrap gap-3 mt-5">
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                  <Calendar size={13} /> {fmtDate(appt.date)}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                  <Clock size={13} /> {fmtTime(appt.time)}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                  <Hash size={13} /> Appt #{id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Appointment Info ── */}
        <Section title="Appointment Details" icon={<Calendar size={16} />}>
          <InfoRow icon={<Calendar size={18} />} label="Date"
            value={fmtDate(appt.date)} />
          <InfoRow icon={<Clock size={18} />} label="Time"
            value={fmtTime(appt.time)} />
          <InfoRow
            icon={<Activity size={18} />}
            label="Type"
            value={appt.appointment_type || 'Telemedicine Consultation'}
          />
          {appt.cancelled_by && (
            <InfoRow icon={<AlertCircle size={18} />} label="Cancelled By"
              value={<span className="text-red-600">{appt.cancelled_by}</span>} />
          )}
          <InfoRow
            icon={<CheckCircle size={18} />}
            label="Appointment Status"
            value={
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${apptStatus.bg} ${apptStatus.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${apptStatus.dot}`} />
                {appt.status}
              </span>
            }
          />
          <div className="border-t border-gray-50 my-2" />
          <InfoRow
            icon={<div className="font-bold text-lg">₹</div>}
            label="Payment Info"
            value={
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${['paid', 'success', 'completed'].includes(appt.payment_status?.toLowerCase() || '') || ['scheduled', 'missed', 'completed'].includes(appt.status.toLowerCase()) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {(['scheduled', 'missed', 'completed'].includes(appt.status.toLowerCase()) ? 'Paid' : appt.payment_status) || 'Pending'}
                </span>
                {appt.amount && <span className="font-black text-gray-800">₹{appt.amount}</span>}
              </div>
            }
          />
        </Section>

        {/* ── Consultation Session ── */}
        {consult ? (
          <Section title="Consultation Session" icon={<Video size={16} />}>
            <InfoRow icon={<Activity size={18} />} label="Session Status"
              value={
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${consultStatus.bg} ${consultStatus.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${consultStatus.dot}`} />
                  {consult.status}
                </span>
              }
            />
            <InfoRow icon={<Hash size={18} />} label="Session ID"
              value={<span className="font-mono text-sm">{consult.session_id || '—'}</span>} />
            <InfoRow icon={<Video size={18} />} label="Video Channel"
              value={<span className="font-mono text-sm">{consult.video_channel || '—'}</span>} />
            <InfoRow icon={<Timer size={18} />} label="Duration"
              value={consult.duration_minutes ? `${consult.duration_minutes} minutes` : '—'} />
            <InfoRow icon={<Clock size={18} />} label="Started At"
              value={fmtDateTime(consult.started_at)} />
            <InfoRow icon={<Clock size={18} />} label="Ended At"
              value={fmtDateTime(consult.ended_at)} />
          </Section>
        ) : (
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-dashed border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video size={32} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-700 text-lg mb-1">No Consultation Session Yet</h3>
            <p className="text-gray-400 text-sm">
              {appt.status === 'Scheduled'
                ? 'The video session will appear here once the consultation begins.'
                : 'No session data was recorded for this appointment.'}
            </p>
          </div>
        )}

        {/* ── Role-specific actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {appt.status === 'Completed' && (
            <button
              onClick={() => navigate(`/prescription/${id}`)}
              className="flex items-center justify-center gap-3 bg-white border-2 border-primary text-primary font-black uppercase tracking-wider text-sm py-5 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-primary/20 hover:shadow-lg"
            >
              <FileText size={20} />
              {isDoctor ? 'View Prescription Given' : role === 'admin' ? 'View Official Prescription' : 'View My Prescription'}
            </button>
          )}

          {appt.status === 'Scheduled' && isDoctor && (
            <button
              onClick={() => navigate(`/doctor-consultation/${id}`)}
              className="flex-1 flex items-center justify-center gap-3 bg-primary text-white font-black uppercase tracking-wider text-sm py-5 rounded-2xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Video size={20} /> Start Consultation
            </button>
          )}

          {appt.status === 'Scheduled' && role === 'patient' && (
            <div className="flex flex-col gap-4 flex-1">
              <button
                onClick={() => navigate(`/consultation/${id}`)}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-black uppercase tracking-wider text-sm py-5 rounded-2xl shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all"
              >
                <Video size={20} /> Join Consultation
              </button>
              <button
                onClick={openShareModal}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-sm py-4 rounded-2xl shadow-sm hover:border-gray-300 transition-all"
              >
                <FileText size={18} /> Share Medical Records
              </button>
            </div>
          )}

          {role === 'admin' && (
            <div className="col-span-full border-t border-gray-100 pt-6 mt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Administrative Audit Tools</p>
              <div className="flex gap-4">
                <button onClick={() => navigate('/admin-appointments')} className="flex-1 bg-gray-900 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-black transition-all">Back to Management</button>
                <button onClick={() => window.print()} className="flex-1 bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-gray-50 transition-all">Download Audit Report</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Share Modal ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-xl text-gray-900">Share Records</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition-colors">✕</button>
            </div>
            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
              {recordsLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : vaultRecords.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 font-medium">Your medical vault is empty.</p>
                  <button onClick={() => { setShowShareModal(false); navigate('/medical-records'); }} className="mt-4 text-blue-600 font-bold hover:underline">Go upload records</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {vaultRecords.map(r => {
                    const isSelected = selectedRecords.includes(r.id);
                    return (
                      <div key={r.id} onClick={() => toggleSelect(r.id)}
                        className={`p-4 border-2 rounded-2xl cursor-pointer flex items-center gap-4 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{r.file_name}</p>
                          <p className="text-xs text-gray-400 font-medium">{r.record_type} • {r.created_at?.split(' ')[0]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button disabled={isSharing} onClick={() => setShowShareModal(false)} className="flex-1 py-3.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button disabled={isSharing || selectedRecords.length === 0 || vaultRecords.length === 0} onClick={submitShare} className={`flex-1 py-3.5 font-bold text-white rounded-xl transition-all shadow-md ${selectedRecords.length > 0 && !isSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}>
                {isSharing ? 'Sharing...' : `Share ${selectedRecords.length > 0 ? `(${selectedRecords.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
