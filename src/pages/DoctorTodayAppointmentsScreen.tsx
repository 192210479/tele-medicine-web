import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getSocket } from '../utils/socketUtils';
import { fmtDate, fmtTime } from '../utils/dateUtils';

type ApptItem = {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_image: string | null;
  date: string;
  time: string;
  status: string;
  consultation_status: string;
};

type TabKey = "Upcoming" | "Completed" | "Missed" | "Cancelled";

const TAB_STATUS: Record<TabKey, string> = {
  Upcoming: "Scheduled",
  Completed: "Completed",
  Missed: "Missed",
  Cancelled: "Cancelled",
};

export function DoctorTodayAppointmentsScreen() {
  const navigate = useNavigate();
  const { userId: authId } = useAuth();
  const doctorId = authId ?? Number(localStorage.getItem("user_id"));

  const [appts, setAppts] = useState<ApptItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("Upcoming");
  const [loading, setLoading] = useState(true);

  const fetchTodayAppts = useCallback(() => {
    setLoading(true);
    fetch(`/api/doctor/appointments/today?doctor_id=${doctorId}`)
      .then(r => r.json())
      .then(data => {
        setAppts(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) fetchTodayAppts();
    const socket = getSocket();
    socket.on('appointment_cancelled', fetchTodayAppts);
    window.addEventListener('appointment-cancelled', fetchTodayAppts);
    return () => {
      socket.off('appointment_cancelled', fetchTodayAppts);
      window.removeEventListener('appointment-cancelled', fetchTodayAppts);
    };
  }, [doctorId, fetchTodayAppts]);

  const filtered = appts.filter(a => a.status === TAB_STATUS[activeTab]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const statusBadgeVariant = (status: string): 'info' | 'success' | 'error' | 'warning' | 'neutral' => {
    switch (status) {
      case 'Scheduled': return 'info';
      case 'Completed': return 'success';
      case 'Missed': return 'error';
      case 'Cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const getAvatarUrl = (img?: string | null): string | null => {
    if (!img) return null;
    if (img.startsWith("/api/") || img.startsWith("http")) return img;
    return `/api/profile/image/file/${img}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <ScreenContainer showBack={false} className="pb-8">
        
        {/* Header - Matching Turned 21's Premium Heading */}
        <div className="bg-white border-b border-gray-100 px-6 py-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-white hover:shadow-md transition-all active:scale-90 shadow-sm"
            >
              &larr;
            </button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1 leading-none opacity-60">Today's Schedule</p>
              <h1 className="text-2xl font-black text-gray-900 leading-none tracking-tight">{todayLabel}</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Tabs - Flat Style */}
          <div className="flex p-1 bg-gray-100/80 rounded-xl mb-6 overflow-x-auto scrollbar-hide">
            {(["Upcoming", "Completed", "Missed", "Cancelled"] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] py-2.5 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end px-2">
               <div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none">{filtered.length} Appointments Recorded</h3>
               </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Synchronizing schedule...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No {activeTab} Appointments Today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* REMOVED: Centered Date grouping header per request */}
                
                {filtered.map((apt) => (
                  <Card
                    key={apt.id}
                    className="cursor-pointer hover:border-primary/20 transition-all border-transparent shadow-soft hover:shadow-md"
                    onClick={() => navigate(`/appointment/${apt.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-4 text-left">
                        {(() => {
                          const patientAvatar = getAvatarUrl(apt.patient_image);
                          return patientAvatar ? (
                            <img
                              src={patientAvatar}
                              alt={apt.patient_name}
                              className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-lg shrink-0">
                              {apt.patient_name?.[0]?.toUpperCase() ?? "P"}
                            </div>
                          );
                        })()}
                        
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg leading-tight">
                            {apt.patient_name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">Consultation</p>
                        </div>
                      </div>
                      <Badge variant={statusBadgeVariant(apt.status)}>
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 text-primary/70">
                          <Calendar size={14} />
                          {fmtDate(apt.date)}
                        </div>
                        <div className="flex items-center gap-1.5 text-primary/70">
                          <Clock size={14} />
                          {fmtTime(apt.time)}
                        </div>
                      </div>
                      <div className="flex items-center text-[10px] font-black text-primary hover:underline uppercase tracking-widest gap-1">
                        View Details <ChevronRight size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScreenContainer>
    </div>
  );
}
