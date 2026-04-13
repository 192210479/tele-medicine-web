import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, User, ChevronRight, Star } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { DoctorAvatar } from '../components/ui/DoctorAvatar';

type HistoryStatus = 'Completed' | 'Missed' | 'Cancelled';

export function HistoryScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HistoryStatus>('Completed');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = useCallback(async () => {
    const rawUserId = localStorage.getItem('user_id') || localStorage.getItem('auth_token');
    const userId = parseInt(rawUserId || '0');
    const role = 'patient';
    
    try {
      const [res, docsRes] = await Promise.all([
        fetch(`/api/patient/history/${userId}?user_id=${userId}&role=${role}`),
        fetch(`/api/doctors`)
      ]);
      if (res.ok && docsRes.ok) {
        const data = await res.json();
        const docs = await docsRes.json();
        const mappedData = data.map((item: any) => {
          const d = docs.find((doc: any) => doc.name === item.doctor_name);
          return {
            ...item,
            id: item.appointment_id || item.id,
            doctor_id: item.doctor_id || d?.id,
            specialization: item.specialization || d?.specialization,
            doctor_image: item.doctor_image || d?.profile_image
          };
        });
        setHistory(mappedData);
      } else if (res.ok) {
        const data = await res.json();
        setHistory(data.map((item: any) => ({ ...item, id: item.appointment_id || item.id })));
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Real-time rating updates listener
  useEffect(() => {
    const handleUpdate = () => {
      fetchHistory();
    };

    window.addEventListener('rating-updated', handleUpdate);
    // Also listen for refocus to catch updates if they rated and came back
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('rating-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [fetchHistory]);

  const getFilteredData = (status: HistoryStatus) => {
    return history.filter(item => 
      item.status && item.status.toLowerCase() === status.toLowerCase() &&
      (item.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.date?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const currentData = getFilteredData(activeTab);

  const getBadgeStyles = (status?: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'completed') return 'bg-green-100 text-green-700';
    if (s === 'missed') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  };

  const isCompleted = (status?: string) => status?.toLowerCase() === 'completed';

  return (
    <ScreenContainer title="Consultation History" showBack className="pb-8 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          {/* Search bar */}
          <div className="relative w-full lg:w-1/3">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctor or consultation date"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-white shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>

          {/* Improved Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1.5 gap-1.5 shadow-inner w-full lg:w-auto">
            {(['Completed', 'Missed', 'Cancelled'] as HistoryStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`flex-1 lg:px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                  activeTab === status ? 'bg-white text-primary shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Records List */}

        {/* Records List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading history...</p>
          </div>
        ) : currentData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentData.map((item) => (
              <Card
                key={item.id}
                onClick={() => isCompleted(item.status) && navigate(`/prescription/${item.id}`)}
                className={`p-5 rounded-2xl bg-white border border-transparent shadow-soft hover:shadow-md hover:border-gray-200 transition-all flex flex-col group ${
                  isCompleted(item.status) ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex flex-col h-full">
                  {/* Top Row: Doctor & Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <DoctorAvatar image={item.doctor_image} name={item.doctor_name} size="sm" />
                       <div>
                         <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">{item.doctor_name}</h3>
                         <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{item.specialization || "Consultation"}</p>
                       </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${getBadgeStyles(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  {/* Info Box */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500 font-bold">
                        <Calendar size={16} className="text-primary/60" />
                        {item.date}
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 font-bold border-l border-gray-200 pl-4">
                        <Clock size={16} className="text-primary/60" />
                        {item.time || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isCompleted(item.status) && (
                    <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                      <div 
                        onClick={(e) => { e.stopPropagation(); navigate(`/prescription/${item.id}`); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-primary/5 hover:bg-primary hover:text-white text-primary text-[11px] font-black uppercase tracking-widest rounded-xl transition-all group/btn"
                      >
                        PRESCRIPTION <ChevronRight size={14} strokeWidth={3} className="transition-transform group-hover/btn:translate-x-1" />
                      </div>
                      {!item.is_rated && !item.rated && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/rate-doctor', {
                              state: {
                                appointment_id: item.id,
                                doctor_id: item.doctor_id,
                                doctor_name: item.doctor_name,
                                specialization: item.specialization,
                                doctor_image: item.doctor_image,
                              }
                            });
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-400 hover:border-yellow-400 text-yellow-700 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                        >
                           RATE DOCTOR <Star size={14} className="mb-0.5 fill-current" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20">
            <EmptyState
              title={`No ${activeTab} Consultations`}
              description={searchTerm ? "No records found matching your search." : `You have no ${activeTab.toLowerCase()} appointments.`}
              illustrationType="empty"
            />
          </div>
        )}
      </div>
    </ScreenContainer>
  );
}
