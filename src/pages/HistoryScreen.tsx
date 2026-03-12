import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, ChevronRight, Clock } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { apiGet } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function HistoryScreen() {
  const { userId, role } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('/api/my-appointments', { user_id: userId, role: role });
      
      // 1. CURRENT TIME CALCULATION
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

      const isHistory = (apt: any) => {
        // 4. COMPLETED APPOINTMENTS RULE
        if (apt.status === 'Completed' || apt.consultation_status === 'Completed') return true;
        
        // Cancelled
        if (apt.status === 'Cancelled') return true;

        // 3. MISSED APPOINTMENTS RULE
        if (apt.status === 'Scheduled') {
          if (apt.date < todayStr) return true;
          if (apt.date === todayStr && (apt.time || apt.time_slot) < currentTimeStr) return true;
        }

        return false;
      };

      const historyData = (data || []).filter(isHistory).sort((a: any, b: any) => {
        // Sort history by date DESC, time DESC
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.time || b.time_slot).localeCompare(a.time || a.time_slot);
      });

      setHistory(historyData);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (apt: any) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    if (apt.status === 'Completed' || apt.consultation_status === 'Completed') return 'Completed';
    if (apt.status === 'Cancelled') return 'Cancelled';
    
    // 3. MISSED APPOINTMENTS RULE
    if (apt.status === 'Scheduled') {
       if (apt.date < todayStr || (apt.date === todayStr && (apt.time || apt.time_slot) < currentTimeStr)) {
         return 'Missed';
       }
    }
    return apt.status;
  };

  const filteredHistory = history.filter(item => 
    (item.doctor_name || item.patient_name)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.date?.includes(searchQuery)
  );

  return (
    <ScreenContainer title="Consultation History" showBack className="pb-8">
      <div className="px-6 py-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search doctor or date"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600">
            <Filter size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const status = getStatusDisplay(item);
              return (
              <Card
                key={item.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/prescription?appointment_id=${item.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-text-primary">
                      {item.doctor_name || item.patient_name}
                    </h3>
                    <p className="text-xs text-text-secondary">{item.specialization || 'Consultation'}</p>
                  </div>
                  {/* 5. Status Badges */}
                  <Badge
                    variant={
                      status === 'Completed' ? 'success' : 
                      status === 'Missed' ? 'error' : 
                      'neutral'
                    }
                  >
                    {status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar size={14} />
                    {item.date} • {item.time || item.time_slot}
                  </div>
                  <div className="flex items-center text-xs font-medium text-primary">
                    View Details <ChevronRight size={14} />
                  </div>
                </div>
              </Card>
            )})}
          </div>
        ) : (
          <EmptyState
            title={searchQuery ? "No matching records" : "No Consultation History"}
            description={searchQuery ? "Try adjusting your search terms" : "You haven't had any consultations yet. Book your first appointment to get started."}
            actionLabel={searchQuery ? "" : "Book Appointment"}
            onAction={() => navigate('/book-appointment')}
            illustrationType="empty"
          />
        )}
      </div>
    </ScreenContainer>
  );
}