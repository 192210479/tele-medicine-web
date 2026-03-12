import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, Pill, User, Calendar, Clock } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiGet } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function PrescriptionScreen() {
  const { id } = useParams();
  const { userId } = useAuth();
  const [prescription, setPrescription] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && userId) {
      loadData();
    }
  }, [id, userId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [prescriptionData, appointmentData] = await Promise.all([
        apiGet(`/api/prescription/${id}`, {
          user_id: userId,
          role: 'patient'
        }),
        apiGet(`/api/appointment/${id}`)
      ]);

      setPrescription(prescriptionData);
      setAppointment(appointmentData);
    } catch (error) {
      console.error('Failed to load prescription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatConsultationDate = (dateStr: string, timeStr: string) => {
    if (!dateStr) return '';
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let dateLabel = dateStr;
    if (dateStr === todayStr) {
      dateLabel = 'Today';
    } else if (dateStr === yesterdayStr) {
      dateLabel = 'Yesterday';
    } else {
      const date = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dateLabel = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    return `${dateLabel} • ${timeStr || ''}`;
  };

  if (isLoading) {
    return (
      <ScreenContainer title="Prescription" showBack>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ScreenContainer>
    );
  }

  if (!prescription) {
    return (
      <ScreenContainer title="Prescription" showBack>
        <div className="px-6 py-12 text-center text-text-secondary">
          No prescription data found for this session.
        </div>
      </ScreenContainer>
    );
  }

  const doctorName = appointment?.doctor_name || prescription.doctor_name || 'Doctor';
  const specialization = appointment?.specialization || prescription.specialization || 'Specialist';
  const qualification = appointment?.qualification ? `${appointment.qualification} • ` : 'MBBS • ';
  const consultationDateTime = formatConsultationDate(appointment?.date, appointment?.time || appointment?.time_slot);

  return (
    <ScreenContainer title="Prescription" showBack>
      <div className="px-6 py-4 space-y-6">
        {/* Doctor Header */}
        <Card className="bg-primary text-white border-none shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <User size={120} />
          </div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-[72px] h-[72px] rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/20 shadow-inner overflow-hidden">
                {appointment?.doctor_image || prescription.doctor_image ? (
                    <img src={appointment?.doctor_image || prescription.doctor_image} alt={doctorName} className="w-full h-full object-cover" />
                ) : (
                    <User size={40} className="text-white" />
                )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold leading-tight">{doctorName}</h2>
              <p className="text-blue-100 text-sm font-medium mt-0.5">
                {qualification}{specialization}
              </p>
              
              <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4">
                 <p className="text-[10px] uppercase font-bold tracking-widest text-blue-200">Consulted on</p>
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {consultationDateTime}
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Diagnosis */}
        <div>
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
            Diagnosis
          </h3>
          <Card className="bg-blue-50 border-blue-100 p-5">
            <p className="font-bold text-text-primary text-lg leading-snug">
              {prescription.diagnosis || 'General Observation'}
            </p>
          </Card>
        </div>

        {/* Medicines */}
        <div>
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
            Medicines
          </h3>
          <div className="space-y-4">
            {prescription.medicines && prescription.medicines.length > 0 ? (
              prescription.medicines.map((medicine: any, idx: number) => (
                <Card key={idx} className="flex gap-4 border-l-4 border-l-success p-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0 text-success shadow-sm">
                    <Pill size={26} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-text-primary text-xl">
                        {medicine.name}
                      </h4>
                      <Badge variant="success">ACTIVE</Badge>
                    </div>
                    <p className="text-sm text-text-secondary font-bold mt-1">
                      {medicine.dosage} • {medicine.frequency}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 border border-gray-200">
                        <Calendar size={12} className="text-gray-400" />
                        {medicine.duration}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-lg text-xs font-bold text-success border border-green-100">
                        <Clock size={12} className="text-green-400" />
                        {medicine.instructions}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                <p className="text-text-secondary font-medium italic">No medicines prescribed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Advice */}
        {prescription.advice && (
          <div>
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
              Doctor's Advice
            </h3>
            <Card className="bg-orange-50 border-orange-100 p-5">
              <p className="text-sm text-gray-700 leading-relaxed font-bold">
                {prescription.advice}
              </p>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4 pb-8">
          <Button
            variant="outline"
            className="flex-1 border-gray-200 h-12 font-bold"
            icon={<Share2 size={18} />}>
            Share
          </Button>
          <Button className="flex-1 h-12 font-bold shadow-lg shadow-primary/20" icon={<Download size={18} />}>
            Download PDF
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}