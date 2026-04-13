import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, User, ChevronRight, FileText } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';

import { getSocket } from '../utils/socketUtils';

export function PatientPrescriptionsScreen() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPrescriptions = async () => {
    const rawUserId = localStorage.getItem('user_id') || localStorage.getItem('auth_token');
    const userId = parseInt(rawUserId || '0');
    const role = 'patient';
    
    try {
      // We fetch history and filter for Completed (Prescription-ready)
      const res = await fetch(`/api/patient/history/${userId}?user_id=${userId}&role=${role}`);
      if (res.ok) {
        const data = await res.json();
        // Filter only completed consultations which usually have prescriptions
        const filtered = (data || []).filter((item: any) => 
          item.status?.toLowerCase() === 'completed'
        );
        setPrescriptions(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch prescriptions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();

    // REAL-TIME: Refresh list when a new prescription is submitted
    const socket = getSocket();
    const handleRefresh = () => {
      fetchPrescriptions();
    };

    socket.on('prescription_submitted', handleRefresh);
    socket.on('prescription_ready', handleRefresh);

    return () => {
      socket.off('prescription_submitted', handleRefresh);
      socket.off('prescription_ready', handleRefresh);
    };
  }, []);

  const filteredData = prescriptions.filter(item => 
    item.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ScreenContainer title="My Prescriptions" showBack className="pb-8 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Prescription Vault</h2>
            <p className="text-gray-500 font-medium">Access all your verified medical prescriptions in one place.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-1/3">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by doctor or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Accessing Secure Records...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredData.map((item) => (
              <Card
                key={item.appointment_id || item.id}
                onClick={() => navigate(`/prescription/view/${item.appointment_id || item.id}`)}
                className="p-0 rounded-[2rem] bg-white border border-transparent shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all flex flex-col group cursor-pointer overflow-hidden"
              >
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-primary to-blue-400 w-full" />
                
                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                       <FileText size={28} />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                       <span className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                          Verified
                       </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-black text-2xl text-gray-900 group-hover:text-primary transition-colors leading-tight mb-1">
                      Dr. {item.doctor_name}
                    </h3>
                    <p className="text-sm text-primary font-bold uppercase tracking-wider opacity-80">
                      {item.specialization || "General Consultation"}
                    </p>
                  </div>
                  
                  {/* Info Box */}
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-3 mb-8 border border-slate-100/50">
                    <div className="flex items-center gap-3 text-gray-600 font-bold text-sm">
                      <Calendar size={18} className="text-primary/60" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 font-bold text-sm">
                      <Clock size={18} className="text-primary/60" />
                      <span>{item.time || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 group-hover:scale-[1.02] active:scale-95 transition-all">
                      VIEW PRESCRIPTION <ChevronRight size={18} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 text-center flex flex-col items-center max-w-2xl mx-auto shadow-inner">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
               <FileText size={48} className="text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Prescriptions Found</h3>
            <p className="text-gray-500 font-medium max-w-sm">
              {searchTerm ? `No records match "${searchTerm}".` : "You haven't received any digital prescriptions yet. Completed consultations will appear here automatically."}
            </p>
          </div>
        )}
      </div>
    </ScreenContainer>
  );
}
