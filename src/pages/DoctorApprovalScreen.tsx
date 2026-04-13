import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenContainer } from '../components/layout/ScreenContainer';

type DoctorItem = {
  id:             number;
  name:           string;
  specialization: string | null;
  status:         "Pending" | "Approved" | "Rejected";
  license_file:   string;   // URL path
  medical_file:   string;   // URL path
  profile_image:  string | null;
  license_number: string | null;
  created_at:     string | null;  // e.g. "Apr 01, 2026"
};

type TabKey = "Pending" | "Approved" | "Rejected";

export function DoctorApprovalScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("Pending");
  const [counts, setCounts] = useState({pending:0, approved:0, rejected:0});
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      const [p, a, r] = await Promise.all([
        fetch("/api/admin/doctors/pending?role=admin").then(r=>r.json()),
        fetch("/api/admin/doctors/approved?role=admin").then(r=>r.json()),
        fetch("/api/admin/doctors/rejected?role=admin").then(r=>r.json()),
      ]);
      setCounts({
        pending:  Array.isArray(p) ? p.length : 0,
        approved: Array.isArray(a) ? a.length : 0,
        rejected: Array.isArray(r) ? r.length : 0,
      });
    } catch (err) {
      console.error("Failed to fetch counts", err);
    }
  }, []);

  const fetchDoctors = useCallback((tab: TabKey) => {
    setLoading(true);
    const urls: Record<TabKey, string> = {
      Pending:  "/api/admin/doctors/pending?role=admin",
      Approved: "/api/admin/doctors/approved?role=admin",
      Rejected: "/api/admin/doctors/rejected?role=admin",
    };
    fetch(urls[tab])
      .then(r => r.json())
      .then((data: DoctorItem[]) => {
        setDoctors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch doctors", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchDoctors(activeTab);
  }, [activeTab, fetchDoctors]);

  const handleApprove = async (doctorId: number) => {
    if (!window.confirm("Are you sure you want to approve this doctor?")) return;
    setActionLoading(doctorId);
    try {
      const res = await fetch(`/api/admin/doctors/approve/${doctorId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: "admin" }),
      });
      if (res.ok) {
        setDoctors(prev => prev.filter(d => d.id !== doctorId));
        fetchCounts();
      }
    } catch (err) {
      console.error("Failed to approve", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (doctorId: number) => {
    if (!window.confirm("Are you sure you want to reject this doctor?")) return;
    setActionLoading(doctorId);
    try {
      const res = await fetch(`/api/admin/doctors/reject/${doctorId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: "admin" }),
      });
      if (res.ok) {
        setDoctors(prev => prev.filter(d => d.id !== doctorId));
        fetchCounts();
      }
    } catch (err) {
      console.error("Failed to reject", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ScreenContainer showBack={false} className="pb-10">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center gap-4 shadow-sm sticky top-0 z-30">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-white hover:shadow-md transition-all active:scale-[0.95]"
          >
            &larr;
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Doctor Approvals</h1>
        </div>

        <div className="max-w-2xl mx-auto p-6 space-y-8">

          {/* Stat Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Pending */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex flex-col items-center justify-center text-center group">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-xl mb-2 group-hover:scale-110 transition-transform shadow-inner">🕐</div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Pending</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{counts.pending}</p>
            </div>

            {/* Approved */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex flex-col items-center justify-center text-center group">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-xl mb-2 group-hover:scale-110 transition-transform shadow-inner">✓</div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Approved</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{counts.approved}</p>
            </div>

            {/* Rejected */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex flex-col items-center justify-center text-center group">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-400 text-xl mb-2 group-hover:scale-110 transition-transform shadow-inner">✕</div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Rejected</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{counts.rejected}</p>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex bg-gray-200/50 backdrop-blur-sm rounded-2xl p-1.5 gap-1.5 shadow-inner">
            {(["Pending", "Approved", "Rejected"] as TabKey[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-white text-primary shadow-md transform scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Doctor Cards */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-soft">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Synchronizing Data...</p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-soft">
                <p className="text-gray-500 font-black uppercase tracking-widest text-lg">
                  No {activeTab} Doctors
                </p>
                <p className="text-gray-400 text-xs font-bold mt-2">
                  {activeTab === "Pending"
                    ? "No doctors are currently awaiting credential review."
                    : activeTab === "Approved"
                    ? "Your approved network list is empty."
                    : "No rejected applications found."}
                </p>
              </div>
            ) : (
              doctors.map(doc => (
                <div key={doc.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-soft p-6 space-y-6 group hover:shadow-md transition-all">

                  {/* Doctor info row */}
                  <div className="flex items-start gap-5">
                    {/* Avatar */}
                    {doc.profile_image ? (
                      <img 
                        src={doc.profile_image.startsWith('/api/') || doc.profile_image.startsWith('http') ? doc.profile_image : `/api/profile/image/file/${doc.profile_image}`} 
                        alt={doc.name}
                        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 shadow-md border-2 border-gray-50"
                        onError={e=>{(e.target as HTMLImageElement).src = URL.createObjectURL(new Blob([`<svg>...</svg>`])); (e.target as HTMLImageElement).style.display="none"}} 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xl flex-shrink-0 shadow-inner">
                        {doc.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 justify-between">
                         <p className="font-black text-gray-900 text-lg leading-none group-hover:text-primary transition-colors truncate">{doc.name}</p>
                         <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm ${
                            doc.status === "Approved" ? "bg-green-100 text-green-700" :
                            doc.status === "Rejected" ? "bg-red-100 text-red-600" :
                            "bg-orange-100 text-orange-600"
                          }`}>
                            {doc.status}
                          </span>
                      </div>
                      <p className="text-primary text-xs font-black uppercase tracking-widest mt-2">{doc.specialization ?? "General Practitioner"}</p>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                         <span>LIC: {doc.license_number ?? "N/A"}</span>
                         {doc.created_at && (
                           <>
                              <span className="opacity-20 text-lg leading-none">|</span>
                              <span>Joined {doc.created_at}</span>
                           </>
                         )}
                      </p>
                    </div>
                  </div>

                  {/* Document links */}
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                    <a
                      href={`/api/doctor/document/${doc.id}/license`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-3 bg-gray-50 hover:bg-white hover:shadow-md py-4 rounded-2xl transition-all group/doc"
                    >
                      <span className="text-2xl group-hover/doc:scale-125 transition-transform">📄</span>
                      <span className="text-gray-600 text-xs font-black uppercase tracking-widest">Medical License</span>
                    </a>
                    <a
                      href={`/api/doctor/document/${doc.id}/medical`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-3 bg-gray-50 hover:bg-white hover:shadow-md py-4 rounded-2xl transition-all group/doc"
                    >
                      <span className="text-2xl group-hover/doc:scale-125 transition-transform">👁️</span>
                      <span className="text-gray-600 text-xs font-black uppercase tracking-widest">Experience Cert</span>
                    </a>
                  </div>

                  {/* Action buttons — only show for Pending tab */}
                  {activeTab === "Pending" && (
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={() => handleReject(doc.id)}
                        disabled={actionLoading === doc.id}
                        className="flex-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50
                                   font-black text-xs uppercase tracking-[0.2em] h-16 rounded-2xl transition-all active:scale-[0.98] border border-red-100"
                      >
                        {actionLoading === doc.id ? "..." : "Reject Candidate"}
                      </button>
                      <button
                        onClick={() => handleApprove(doc.id)}
                        disabled={actionLoading === doc.id}
                        className="flex-1 bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50
                                   font-black text-xs uppercase tracking-[0.2em] h-16 rounded-2xl transition-all active:scale-[0.98]"
                      >
                        {actionLoading === doc.id ? "..." : "Approve Account"}
                      </button>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>
      </ScreenContainer>
    </div>
  );
}
