import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, User, Calendar, Search } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiGet } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function PatientPrescriptionsScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userId) {
      loadAllPrescriptions();
    }
  }, [userId]);

  const loadAllPrescriptions = async () => {
    setIsLoading(true);
    try {
      // 1. Get all appointments for the patient
      const appointments = await apiGet('/api/my-appointments', { 
        user_id: userId, 
        role: 'patient' 
      });

      // 2. For each appointment, fetch prescription details
      const prescriptionPromises = (appointments || []).map(async (apt: any) => {
        try {
          const data = await apiGet(`/api/prescription/${apt.id}`, {
            user_id: userId,
            role: 'patient'
          });
          if (data && data.diagnosis) {
            return {
              ...data,
              appointment_id: apt.id,
              date: apt.date,
              doctor_name: apt.doctor_name || data.doctor_name
            };
          }
          return null;
        } catch (e) {
          return null; // Ignore if no prescription exists
        }
      });

      const results = await Promise.all(prescriptionPromises);
      const filteredResults = results.filter(item => item !== null);
      
      // Sort by date DESC
      filteredResults.sort((a, b) => b.date.localeCompare(a.date));
      
      setPrescriptions(filteredResults);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(item => 
    item.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenContainer title="My Prescriptions" showBack className="pb-8">
      <div className="px-6 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by doctor or diagnosis"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-primary shadow-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPrescriptions.length > 0 ? (
          <div className="space-y-4">
            {filteredPrescriptions.map((item) => (
              <Card
                key={item.appointment_id}
                className="hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => navigate(`/prescription/${item.appointment_id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary border border-blue-100">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors">
                        {item.doctor_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                        <Calendar size={12} />
                        {item.date}
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Diagnosis Preview</p>
                  <p className="text-sm font-medium text-text-primary line-clamp-1">
                    {item.diagnosis}
                  </p>
                </div>

                <Button 
                    fullWidth 
                    variant="outline" 
                    className="h-10 text-xs font-bold border-gray-200 group-hover:border-primary group-hover:text-primary"
                    icon={<FileText size={14} />}
                >
                  View Full Prescription
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
              <FileText size={40} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">No Prescriptions Found</h3>
            <p className="text-text-secondary text-sm max-w-[200px] mx-auto mt-2">
              You haven't received any prescriptions from your doctors yet.
            </p>
          </div>
        )}
      </div>
    </ScreenContainer>
  );
}
