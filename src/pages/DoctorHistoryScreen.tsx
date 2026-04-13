import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Calendar, Clock, ChevronRight, ArrowLeft, FileText } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';

type AppointmentItem = {
  id:                  number;
  patient_id:          number;
  patient_name:        string;
  patient_image:       string | null;
  doctor_name:         string;
  specialization:      string | null;
  date:                string | null;   // "YYYY-MM-DD"
  time:                string | null;   // "HH:MM"
  status:              string;
  consultation_status: string;
  cancelled_by:        string | null;
};

type PrescriptionDetail = {
  diagnosis:             string;
  advice:                string;
  status:                string;
  doctor_name:           string;
  doctor_specialization: string;
  medicines: {
    name:         string;
    dosage:       string;
    frequency:    string;
    duration:     string;
    instructions: string | null;
  }[];
};

export function DoctorHistoryScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const doctorId = userId ?? Number(localStorage.getItem("user_id"));

  const [activeTab, setActiveTab]       = useState<"Completed"|"Missed"|"Cancelled">("Completed");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [selectedAppt, setSelectedAppt] = useState<AppointmentItem | null>(null);

  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null);
  const [loadingRx, setLoadingRx]       = useState(false);
  const [rxError, setRxError]           = useState<string | null>(null);

  const fetchHistory = (tab: string) => {
    if (!doctorId) return;
    setLoading(true);
    fetch(`/api/my-appointments?user_id=${doctorId}&role=doctor&status=${tab}`)
      .then(r => r.json())
      .then((data: AppointmentItem[]) => {
        setAppointments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { 
    if (!selectedAppt) {
        fetchHistory(activeTab); 
    }
  }, [activeTab, doctorId, selectedAppt]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Medical Prescription - ${prescription?.doctor_name}`,
          text: `View prescription from Dr. ${prescription?.doctor_name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      window.alert('Sharing is not supported on this browser.');
    }
  };

  useEffect(() => {
    if (!selectedAppt || !doctorId) return;
    setLoadingRx(true);
    setRxError(null);
    setPrescription(null);
    fetch(`/api/prescription/${selectedAppt.id}?user_id=${doctorId}&role=doctor`)
      .then(r => {
        if (!r.ok) throw new Error("Prescription not found");
        return r.json();
      })
      .then((data: PrescriptionDetail) => {
        setPrescription(data);
        setLoadingRx(false);
      })
      .catch(err => {
        setRxError(err.message ?? "No prescription available");
        setLoadingRx(false);
      });
  }, [selectedAppt, doctorId]);

  const filtered = appointments.filter(a =>
    (a.patient_name?.toLowerCase().includes(search.toLowerCase())) ||
    (a.date?.includes(search))
  );

  const fmtDate = (raw: string | null): string => {
    if (!raw) return "—";
    const [y, m, d] = raw.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", {
      month: "short", day: "2-digit", year: "numeric"
    });
  };

  const Avatar = ({ img, name }: { img: string | null; name: string }) => {
    const avatarUrl = img ? (img.startsWith('/api/') || img.startsWith('http') ? img : `/api/profile/image/file/${img}`) : null;
    return avatarUrl ? (
      <img src={avatarUrl} alt={name}
           className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100 shadow-sm"
           onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
    ) : (
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center
                      justify-center text-blue-700 font-bold flex-shrink-0 border border-blue-50">
        {name?.[0]?.toUpperCase() ?? "P"}
      </div>
    );
  };

  const statusColor = (s: string) => {
    if (s === "Completed") return "bg-green-100 text-green-700";
    if (s === "Missed")    return "bg-orange-100 text-orange-700";
    if (s === "Cancelled") return "bg-red-100 text-red-600";
    return "bg-gray-100 text-gray-600";
  };

  const renderListView = () => (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        {/* Search bar */}
        <div className="relative w-full lg:w-1/3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient name or appointment date"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100
                       bg-white shadow-soft focus:outline-none focus:ring-2
                       focus:ring-primary/20 text-sm transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1.5 gap-1.5 shadow-inner w-full lg:w-auto">
          {(["Completed","Missed","Cancelled"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(""); }}
              className={`flex-1 lg:px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-primary shadow-md transform scale-[1.02]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-soft max-w-lg mx-auto">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Calendar size={40} className="text-gray-200" />
          </div>
          <p className="text-text-primary font-bold text-xl mb-2">
            No {activeTab} Consultations
          </p>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            {activeTab === "Completed"
              ? "You haven't completed any appointments yet."
              : activeTab === "Missed"
              ? "No missed appointments found for your account."
              : "No cancelled appointments recorded."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
            const grouped = filtered.reduce((acc: Record<string, AppointmentItem[]>, apt) => {
              const date = apt.date ?? "Unknown";
              if (!acc[date]) acc[date] = [];
              acc[date].push(apt);
              return acc;
            }, {});

            const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

            return sortedDates.map(date => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-[1px] bg-gray-200 flex-1"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    {fmtDate(date)}
                  </span>
                  <div className="h-[1px] bg-gray-200 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {grouped[date].map(appt => (
                    <Card key={appt.id}
                         className="bg-white rounded-2xl border border-transparent
                                    shadow-soft p-5 hover:shadow-md hover:border-gray-200 transition-all flex flex-col group">
                      {/* Top row: avatar + name + status badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Avatar img={appt.patient_image} name={appt.patient_name} />
                          <div>
                            <p className="font-bold text-text-primary text-lg group-hover:text-primary transition-colors">{appt.patient_name}</p>
                            <p className="text-text-secondary text-xs font-semibold">
                              {appt.specialization ?? "General Consultation"}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-xl ${statusColor(appt.status)} shadow-sm`}>
                          {appt.status}
                        </span>
                      </div>

                      {/* Date + time row */}
                      <div className="flex items-center gap-4 text-text-secondary text-sm mb-4 p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary/60" />
                          <span className="font-bold">{fmtDate(appt.date)}</span>
                        </div>
                        {appt.time && (
                          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                            <Clock size={16} className="text-primary/60" />
                            <span className="font-bold">{appt.time}</span>
                          </div>
                        )}
                        {appt.cancelled_by && (
                          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                            <span className="text-red-500 text-[10px] font-black uppercase tracking-tighter">
                              By {appt.cancelled_by}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* View Prescription button — only for Completed */}
                      <div className="mt-auto">
                        {appt.status === "Completed" && (
                          <div className="flex justify-end pt-4 mt-2 border-t border-gray-50">
                            <button
                              onClick={() => setSelectedAppt(appt)}
                              className="text-primary text-sm font-black uppercase tracking-wider
                                         flex items-center justify-center gap-2 hover:gap-3 transition-all group/btn bg-primary/5 hover:bg-primary hover:text-white w-full px-4 py-3 rounded-xl"
                            >
                              View Prescription
                              <ChevronRight size={16} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );

  const renderPrescriptionView = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => { setSelectedAppt(null); setPrescription(null); setRxError(null); }}
        className="flex items-center gap-2 text-primary mb-6 hover:underline font-bold transition-all hover:gap-3"
      >
        <ArrowLeft size={20} strokeWidth={3} />
        BACK TO HISTORY
      </button>

      {loadingRx ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-white rounded-3xl shadow-soft">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Fetching secure prescription record...</p>
        </div>
      ) : rxError ? (
        <div className="text-center py-32 bg-white rounded-3xl shadow-soft">
          <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <FileText size={40} className="text-orange-400" />
          </div>
          <h2 className="text-gray-900 font-black text-2xl mb-2">Prescription Unavailable</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">{rxError}</p>
        </div>
      ) : prescription && (
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Watermark Removed */}

          {/* Official Document Header */}
          <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-700/50 to-transparent pointer-events-none" />
             <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                   <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">{prescription.doctor_name || selectedAppt?.doctor_name}</h1>
                   <div className="inline-block bg-primary/20 text-primary-light px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border border-primary/30">
                      {prescription.doctor_specialization || selectedAppt?.specialization || "Consulting Physician"}
                   </div>
                </div>
                <div className="text-left md:text-right">
                   <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Official Prescription</p>
                   <p className="text-xl font-bold tracking-tight">Ref: #{selectedAppt?.id.toString().padStart(6, '0')}</p>
                </div>
             </div>
          </div>

          {/* Patient Info Strip */}
          <div className="bg-primary/5 border-b border-primary/10 p-6 md:px-12 flex flex-col md:flex-row justify-between gap-4">
             <div>
                <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-1">Patient Name</p>
                <p className="text-xl font-bold text-gray-900">{selectedAppt?.patient_name}</p>
             </div>
             <div>
                <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-1">Consultation Date</p>
                <p className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <Calendar size={18} className="text-primary" /> {fmtDate(selectedAppt?.date ?? "")}
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
              <div className="pl-11 text-2xl font-medium text-gray-900 leading-relaxed">
                 {prescription.diagnosis}
              </div>
            </div>

            {/* Medicines List */}
            {prescription.medicines.length > 0 && (
              <div className="relative">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                   <span className="w-8 h-[1px] bg-gray-200 block"></span>
                   Prescribed Medication
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 md:pl-11">
                  {prescription.medicines.map((med, i) => (
                    <div key={i} className="group relative border border-gray-100 rounded-2xl p-6 bg-white hover:border-primary/30 hover:shadow-lg transition-all">
                      <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                        {i + 1}
                      </div>
                      <div className="mb-4">
                        <h4 className="font-black text-xl text-gray-900 tracking-tight leading-none mb-2">{med.name}</h4>
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
                           {med.duration}
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
            
            {/* Footer Sign-off */}
            <div className="pt-8 mt-12 border-t border-gray-100 mb-8">
               <div className="flex justify-between items-end opacity-50 grayscale">
                  <div>
                     <p className="text-xs font-bold text-gray-400 mb-1">Digitally Signed By</p>
                     <p className="text-xl font-serif text-gray-900">{prescription.doctor_name || selectedAppt?.doctor_name}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">TeleHealth+ Verified</p>
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
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
      )}
    </div>
  );

  return (
    <>
    <div className="min-h-screen bg-[#F5F7FB]">
      <ScreenContainer
        title={selectedAppt ? "Prescription" : "Consultation History"}
        showBack={true}
        onBackClick={() => {
            if (selectedAppt) {
                setSelectedAppt(null);
                setPrescription(null);
            } else {
                navigate(-1);
            }
        }}
      >
        {selectedAppt ? renderPrescriptionView() : renderListView()}
      </ScreenContainer>
    </div>
    <style>{`
      @media print {
        .no-print { display: none !important; }
        .bg-[#F5F7FB] { background: white !important; }
        .shadow-xl { shadow: none !important; }
      }
    `}</style>
    </>
  );
}
