import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getSocket } from '../utils/socketUtils';
import { useAuth } from '../context/AuthContext';

export function DoctorAppointmentsScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'missed' | 'cancelled'>('upcoming');
  const { userId: authUserId } = useAuth();
  const doctorId = authUserId
    ?? Number(localStorage.getItem("user_id"))
    ?? Number(sessionStorage.getItem("user_id"));

  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(() => {
    if (!doctorId || isNaN(doctorId)) return;
    setLoading(true);
    setError(null);

    fetch(`/api/my-appointments?user_id=${doctorId}&role=doctor`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        const arr = Array.isArray(data) ? data : [];
        setAllAppointments(arr);
        setLoading(false);
      })
      .catch(err => {
        console.error("Appointments fetch error:", err);
        setError("Failed to load appointments. Please try again.");
        setAllAppointments([]);
        setLoading(false);
      });
  }, [doctorId]);

  useEffect(() => {
    fetchAppointments();
    const socket = getSocket();
    socket.on('appointment_cancelled', fetchAppointments);
    window.addEventListener('appointment-cancelled', fetchAppointments);

    return () => {
      socket.off('appointment_cancelled', fetchAppointments);
      window.removeEventListener('appointment-cancelled', fetchAppointments);
    };
  }, [fetchAppointments]);

  const formatDate = (raw: string): string => {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short", day: "2-digit", year: "numeric"
    });
  };

  const formatTime = (raw: string): string => {
    if (!raw || raw === "N/A") return raw ?? "—";
    const [h, m] = raw.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    return `${(h % 12 || 12).toString().padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  };

  const upcomingAppointments   = allAppointments.filter(a => a.status === "Scheduled");
  const completedAppointments  = allAppointments.filter(a => a.status === "Completed");
  const missedAppointments     = allAppointments.filter(a => a.status === "Missed");
  const cancelledAppointments  = allAppointments.filter(a => a.status === "Cancelled");

  const sorted = {
    upcoming:   [...upcomingAppointments].sort((a,b) =>
                  a.date === b.date
                    ? a.time.localeCompare(b.time)
                    : a.date.localeCompare(b.date)),
    completed:  [...completedAppointments].sort((a,b) =>
                  b.date === a.date
                    ? b.time.localeCompare(a.time)
                    : b.date.localeCompare(a.date)),
    missed:     [...missedAppointments].sort((a,b) =>
                  b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    cancelled:  [...cancelledAppointments].sort((a,b) =>
                  b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
  };

  const tabData: Record<string, any[]> = {
    "upcoming":   sorted.upcoming,
    "completed":  sorted.completed,
    "missed":     sorted.missed,
    "cancelled":  sorted.cancelled,
  };

  const displayList = tabData[activeTab] ?? [];

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
    <ScreenContainer 
      title="My Appointments" 
      showBack={true} 
      onBackClick={() => navigate('/doctor/dashboard')}
      className="pb-8"
    >
      <div className="px-6 py-4">
        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto scrollbar-hide">
          {(['upcoming', 'completed', 'missed', 'cancelled'] as const).map(
            (tab) =>
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] py-2 px-3 text-sm font-medium rounded-lg capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              
                {tab}
              </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : error ? (
            <p className="text-center text-red-400 py-8">{error}</p>
          ) : displayList.length > 0 ? (
            (() => {
              const grouped = displayList.reduce((acc: Record<string, any[]>, apt) => {
                const date = apt.date;
                if (!acc[date]) acc[date] = [];
                acc[date].push(apt);
                return acc;
              }, {});

              const sortedDates = Object.keys(grouped).sort((a, b) => {
                if (activeTab === 'upcoming') return a.localeCompare(b);
                return b.localeCompare(a);
              });

              return sortedDates.map(date => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      {formatDate(date)}
                    </span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                  {grouped[date].map((apt) => (
                    <Card
                      key={apt.id}
                      className="cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => navigate(`/appointment/${apt.id}`)}>
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3 text-left">
                          {(() => {
                            const patientAvatar = getAvatarUrl(apt.patient_image);
                            return patientAvatar ? (
                              <img
                                src={patientAvatar}
                                alt={apt.patient_name}
                                className="w-12 h-12 rounded-full object-cover shrink-0"
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-lg shrink-0">
                                {apt.patient_name?.[0] ?? "P"}
                              </div>
                            );
                          })()}
                          
                          <div>
                            <h3 className="font-bold text-text-primary">
                              {apt.patient_name}
                            </h3>
                            <p className="text-sm text-text-secondary">{apt.appointment_type || 'Consultation'}</p>
                          </div>
                        </div>
                        <Badge variant={statusBadgeVariant(apt.status)}>
                          {apt.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-primary" />
                            {formatDate(apt.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-primary" />
                            {formatTime(apt.time)}
                          </div>
                        </div>
                        <div className="flex items-center text-xs font-medium text-primary hover:underline">
                          View Details <ChevronRight size={14} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ));
            })()
          ) : (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-dashed border-2 border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 shadow-sm">
                <Calendar size={32} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                No appointments found
              </h3>
              <p className="text-text-secondary text-sm">
                You don't have any {activeTab} appointments at the moment.
              </p>
              <button 
                onClick={() => fetchAppointments()}
                className="mt-4 text-sm text-primary font-bold hover:underline"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}
