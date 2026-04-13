import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { DoctorAvatar } from '../components/ui/DoctorAvatar';
import { getSocket } from '../utils/socketUtils';
import { useCallback } from 'react';

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  fee: number;
  rating: number;
  reviews_count: number;
  profile_image: string | null;
}

export function DoctorListScreen() {
  const navigate = useNavigate();
  // @ts-ignore
  const { userId } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDoctors = useCallback(() => {
    fetch('/api/doctors')
      .then(r => r.json())
      .then(data => {
        setDoctors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('rating_updated', fetchDoctors);
    window.addEventListener('rating-updated', fetchDoctors);
    window.addEventListener('focus', fetchDoctors);

    return () => {
      socket.off('rating_updated', fetchDoctors);
      window.removeEventListener('rating-updated', fetchDoctors);
      window.removeEventListener('focus', fetchDoctors);
    };
  }, [fetchDoctors]);

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ScreenContainer showBack={false} className="pb-10">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-white hover:shadow-md transition-all active:scale-95"
            >
              &larr;
            </button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Search Experts</p>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Browse Specialists</h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Search Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-gray-400">
              <Search size={20} strokeWidth={2.5} />
            </div>
            <input 
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-100 shadow-soft focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-soft">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Listing Our Specialists...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] shadow-soft border border-gray-100 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                 <Search size={36} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-gray-800 tracking-tight">No experts found</p>
                <p className="text-sm text-gray-400 font-medium">Try adjusting your search terms</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => navigate(`/doctor/${doc.id}`)}
                  className="bg-white rounded-[2rem] border border-gray-50 shadow-soft p-5 flex items-center gap-5 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
                >
                  <DoctorAvatar image={doc.profile_image} name={doc.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{doc.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 mb-2">{doc.specialization}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-gray-700">{doc.reviews_count === 0 ? "0.0" : doc.rating}</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-primary" />
                        <span className="text-xs font-bold text-gray-700">{doc.experience} Yr</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all">
                     &rarr;
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScreenContainer>
    </div>
  );
}
