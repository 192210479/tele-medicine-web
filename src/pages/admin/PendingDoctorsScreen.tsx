import { useState, useEffect } from "react";

interface PendingDoctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
  license_number: string;
  experience_years: number | null;
  fee: number | null;
  languages: string | null;
  bio: string | null;
  status: string;
  license_file: string | null;
  medical_file: string | null;
  profile_image: string | null;
  created_at: string;
}

type Tab = "Pending" | "Approved" | "Rejected";

const TAB_ENDPOINT: Record<Tab, string> = {
  Pending:  "/api/admin/doctors/pending",
  Approved: "/api/admin/doctors/approved",
  Rejected: "/api/admin/doctors/rejected",
};

/** Normalize any file path returned by the backend into a clickable URL */
function resolveFileUrl(path: string | null): string | null {
  if (!path) return null;
  // Already a full API path or http(s) URL — use as-is
  if (path.startsWith("http") || path.startsWith("/api/")) return path;
  // Old /uploads/ format — served via /api/doctor/documents/download or similar
  // Strip leading slash if present and serve via direct express static or uploads path
  if (path.startsWith("/uploads/")) return path; // vite proxy will handle
  return path;
}

export default function PendingDoctorsScreen() {
  const [tab, setTab]           = useState<Tab>("Pending");
  const [doctors, setDoctors]   = useState<PendingDoctor[]>([]);
  const [loading, setLoading]   = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  async function fetchDoctors(t: Tab) {
    setLoading(true);
    try {
      const res  = await fetch(`${TAB_ENDPOINT[t]}?role=admin`);
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDoctors(tab); }, [tab]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAction(doctorId: number, action: "approve" | "reject") {
    setActionLoading(doctorId);
    try {
      const endpoint = action === "approve"
        ? `/api/admin/doctors/approve/${doctorId}`
        : `/api/admin/doctors/reject/${doctorId}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Doctor ${action}d successfully`, true);
        setDoctors(d => d.filter(doc => doc.id !== doctorId));
        setExpanded(null);
      } else {
        showToast(data.error || "Action failed. Please try again.", false);
      }
    } catch {
      showToast("Network error. Please try again.", false);
    } finally {
      setActionLoading(null);
    }
  }

  function getInitials(name: string) {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function fmtDate(raw: string) {
    if (!raw) return "—";
    try { return new Date(raw).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return raw; }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium text-sm flex items-center gap-2 transition-all ${toast.ok ? "bg-green-500" : "bg-red-500"}`}>
          <span>{toast.ok ? "✓" : "✗"}</span>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Doctor Approvals</h1>
        <p className="text-text-secondary text-sm mt-1">
          Review doctor registrations and verify their documents before approving access.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(["Pending", "Approved", "Rejected"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? "bg-white shadow text-primary" : "text-text-secondary hover:text-text-primary"
            }`}>
            {t}
            {t === "Pending" && doctors.length > 0 && tab === "Pending" && (
              <span className="ml-2 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                {doctors.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          <p className="text-5xl mb-4">🩺</p>
          <p className="font-semibold text-lg">No {tab.toLowerCase()} doctors</p>
          <p className="text-sm mt-1">
            {tab === "Pending"
              ? "All registrations have been reviewed."
              : `No doctors have been ${tab.toLowerCase()} yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {doctors.map(doc => {
            const licenseUrl = resolveFileUrl(doc.license_file);
            const medicalUrl = resolveFileUrl(doc.medical_file);
            const isExpanded = expanded === doc.id;

            return (
              <div key={doc.id}
                className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden transition-all">

                {/* Card Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">

                  {/* Avatar */}
                  {doc.profile_image ? (
                    <img
                      src={doc.profile_image.startsWith("/api/") || doc.profile_image.startsWith("http")
                        ? doc.profile_image
                        : `/api/profile/image/file/${doc.profile_image}`}
                      alt={doc.name}
                      className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-xl">{getInitials(doc.name)}</span>
                    </div>
                  )}

                  {/* Core Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-text-primary text-lg">Dr. {doc.name}</h3>
                      <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {doc.specialization || "General"}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        doc.status === "Approved" ? "bg-green-100 text-green-700"
                        : doc.status === "Rejected" ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{doc.email}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-secondary">
                      <span>📋 License: <span className="font-semibold text-text-primary">{doc.license_number || "—"}</span></span>
                      {doc.experience_years != null && <span>⏱ {doc.experience_years} yrs exp</span>}
                      {doc.fee != null && <span>💰 ₹{doc.fee} / consult</span>}
                      <span>📅 Applied: {fmtDate(doc.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0 items-end">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : doc.id)}
                      className="px-4 py-2 text-sm border border-gray-200 text-text-secondary rounded-xl hover:bg-gray-50 transition-colors">
                      {isExpanded ? "▲ Less" : "▼ Details"}
                    </button>
                    {tab === "Pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(doc.id, "approve")}
                          disabled={actionLoading === doc.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                          {actionLoading === doc.id ? (
                            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                          ) : "✓"} Approve
                        </button>
                        <button
                          onClick={() => handleAction(doc.id, "reject")}
                          disabled={actionLoading === doc.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                          {actionLoading === doc.id ? (
                            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                          ) : "✗"} Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-4">

                    {/* Bio */}
                    {doc.bio && (
                      <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">About</p>
                        <p className="text-sm text-text-primary">{doc.bio}</p>
                      </div>
                    )}

                    {/* Languages */}
                    {doc.languages && (
                      <div>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Languages</p>
                        <p className="text-sm text-text-primary">{doc.languages}</p>
                      </div>
                    )}

                    {/* Documents */}
                    <div>
                      <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Submitted Documents</p>
                      <div className="flex flex-wrap gap-3">
                        {licenseUrl ? (
                          <a
                            href={licenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors font-medium">
                            📄 View License Document
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-sm bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl">
                            📄 No License Document
                          </span>
                        )}

                        {medicalUrl ? (
                          <a
                            href={medicalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-xl hover:bg-purple-100 transition-colors font-medium">
                            📋 View Medical Records
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-sm bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl">
                            📋 No Medical Records
                          </span>
                        )}
                      </div>
                      {(!licenseUrl && !medicalUrl) && (
                        <p className="text-xs text-amber-600 mt-2">⚠️ No documents found for this doctor registration.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
