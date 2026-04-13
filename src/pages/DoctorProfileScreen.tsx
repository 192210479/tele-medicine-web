import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Globe, DollarSign, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { DoctorAvatar } from '../components/ui/DoctorAvatar';
import { getSocket } from '../utils/socketUtils';

interface DoctorDetail {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  fee: number;
  rating: number;
  reviews_count: number;
  bio: string;
  profile_image: string | null;
}

export function DoctorProfileScreen() {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  // @ts-ignore
  const { userId } = useAuth();

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDoctor = useCallback(() => {
    fetch(`/api/doctor/${doctorId}`)
      .then(r => r.json())
      .then(data => {
        setDoctor(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  useEffect(() => {
    const socket = getSocket();
    const handleRatingUpdate = () => fetchDoctor();
    
    socket.on('rating_updated', handleRatingUpdate);
    window.addEventListener('rating-updated', handleRatingUpdate);
    window.addEventListener('focus', handleRatingUpdate);

    return () => {
      socket.off('rating_updated', handleRatingUpdate);
      window.removeEventListener('rating-updated', handleRatingUpdate);
      window.removeEventListener('focus', handleRatingUpdate);
    };
  }, [fetchDoctor]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Retreiving Specialist Profile...</p>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ScreenContainer showBack={false} className="pb-10">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center gap-4 shadow-sm sticky top-0 z-30">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-white hover:shadow-md transition-all active:scale-95"
          >
            &larr;
          </button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Details</p>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Expert Insights</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft p-10 flex flex-col items-center text-center space-y-6">
            <DoctorAvatar image={doctor.profile_image} name={doctor.name} size="lg" />
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{doctor.name}</h2>
              <p className="text-primary font-black uppercase text-xs tracking-widest">{doctor.specialization}</p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className="font-black text-gray-900 leading-none">{doctor.reviews_count === 0 ? "0.0" : doctor.rating}</span>
                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-none">({doctor.reviews_count} reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-lg pt-6">
              <div className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-blue-50 border border-blue-50 shadow-inner group hover:scale-105 transition-transform">
                <Award size={24} className="text-primary" />
                <span className="font-black text-gray-900 tracking-tight">{doctor.experience}yr+</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Experience</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-green-50 border border-green-50 shadow-inner group hover:scale-105 transition-transform">
                <DollarSign size={24} className="text-green-500" />
                <span className="font-black text-gray-900 tracking-tight">₹{doctor.fee}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fee</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-purple-50 border border-purple-50 shadow-inner group hover:scale-105 transition-transform">
                <Globe size={24} className="text-purple-500" />
                <span className="font-black text-gray-900 tracking-tight">EN, HI</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Languages</span>
              </div>
            </div>

            <div className="w-full text-left space-y-4 pt-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">About Specialist</h3>
              <p className="text-gray-500 font-medium text-sm leading-loose opacity-80">{doctor.bio || "Patient-centric expert known for precise diagnosis and personalized treatment paths. Dedicated to improving healthcare outcomes."}</p>
            </div>

            <button 
              onClick={() => navigate('/book-appointment', { state: { doctorId: doctor.id }})}
              className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-3xl font-black uppercase text-[12px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Continue to Booking
            </button>
          </div>
        </div>
      </ScreenContainer>
    </div>
  );
}
