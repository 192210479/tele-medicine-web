import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { FileText, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { getSocket } from '../utils/socketUtils';

interface PatientSummary {
  id:               number;
  name:             string;
  profile_image:    string | null;
  records_shared:   number;
  last_appointment: string | null;
}

interface SharedRecord {
  id:           number;
  file_name:    string;
  file_url:     string;
  record_type:  string;
  description:  string | null;
  uploaded_at:  string;
}

export function DoctorReviewReportsScreen() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const doctorId = userId ?? Number(localStorage.getItem("user_id"));

  const [patients, setPatients]           = useState<PatientSummary[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedPatient, setSelected]    = useState<PatientSummary | null>(null);

  const [records, setRecords]     = useState<SharedRecord[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    fetch(`/api/doctor/patients?user_id=${doctorId}&role=doctor`)
      .then(r => r.json())
      .then((data: any[]) => {
        const mapped = (Array.isArray(data) ? data : []).map(p => ({
            id: p.id,
            name: p.full_name || p.name || 'Unknown',
            profile_image: p.profile_image,
            records_shared: p.total_records || p.records_shared || 0,
            last_appointment: p.last_appointment
        }));
        const sharedOnly = mapped.filter(p => p.records_shared > 0);
        setPatients(sharedOnly);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (!selectedPatient || !doctorId) return;
    
    let isMounted = true;
    const fetchRecords = () => {
      setLoadingRec(true);
      fetch(`/api/doctor/review-records/${doctorId}?patient_id=${selectedPatient.id}`)
        .then(r => r.json())
        .then((data: SharedRecord[]) => {
          if (isMounted) {
            setRecords(Array.isArray(data) ? data : []);
            setLoadingRec(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoadingRec(false);
        });
    };
    
    fetchRecords();
    
    const socket = getSocket();
    socket.on('medical_record_shared', fetchRecords);
    socket.on('medical_record_uploaded', fetchRecords);
    
    return () => {
      isMounted = false;
      socket.off('medical_record_shared', fetchRecords);
      socket.off('medical_record_uploaded', fetchRecords);
    };
  }, [selectedPatient, doctorId]);

  const getAvatar = (img: string | null, name: string) => {
    const avatarUrl = img ? (img.startsWith('/api/') || img.startsWith('http') ? img : `/api/profile/image/file/${img}`) : null;
    
    return avatarUrl ? (
      <img src={avatarUrl} alt={name}
           className="w-12 h-12 rounded-full object-cover"
           onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
    ) : (
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center
                      justify-center text-blue-700 font-bold text-lg">
        {name?.[0]?.toUpperCase() ?? "P"}
      </div>
    );
  };

  if (selectedPatient) {
    return (
      <ScreenContainer title="Patient Records" showBack onBackClick={() => setSelected(null)}>
        <div className="p-6">
          <button onClick={() => setSelected(null)}
                  className="flex items-center gap-2 text-primary mb-6 hover:underline font-medium">
            <ChevronLeft size={20} />
            Back to Patients
          </button>

          <Card className="flex items-center gap-4 mb-8 p-6 bg-white border-none shadow-soft">
            {getAvatar(selectedPatient.profile_image, selectedPatient.name)}
            <div>
              <p className="font-bold text-text-primary text-xl">{selectedPatient.name}</p>
              <p className="text-text-secondary">
                {selectedPatient.records_shared} record{selectedPatient.records_shared !== 1 ? "s" : ""} shared
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text-primary mb-2">Shared Medical Records</h3>
            {loadingRec ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-text-secondary mt-4">Loading records...</p>
              </div>
            ) : records.length === 0 ? (
              <Card className="text-center py-12 bg-gray-50 border-dashed border-2 border-gray-200">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-text-secondary">No records shared by this patient yet.</p>
              </Card>
            ) : (
              records.map(rec => (
                <Card key={rec.id}
                     className="bg-white border-none shadow-soft p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center
                                    justify-center text-primary">
                      {rec.file_name.toLowerCase().endsWith(".pdf") ? "📄" :
                       rec.file_name.toLowerCase().match(/\.(png|jpg|jpeg)$/i) ? "🖼️" : "📁"}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary text-base">{rec.file_name}</p>
                      <p className="text-text-secondary text-sm">
                        {rec.record_type} · {rec.uploaded_at}
                      </p>
                      {rec.description && (
                        <p className="text-gray-400 text-xs mt-1 truncate max-w-xs">{rec.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a href={`/api/medical-record/download/${rec.id}?view=true&user_id=${doctorId}&role=doctor`}
                       target="_blank" rel="noreferrer"
                       className="flex items-center gap-2 text-sm text-primary hover:bg-primary/5 font-bold px-4 py-2
                                  border border-primary/20 rounded-xl transition-colors">
                      <Eye size={16} />
                      View
                    </a>
                    <a href={`/api/medical-record/download/${rec.id}?user_id=${doctorId}&role=doctor`}
                       download={rec.file_name}
                       className="flex items-center gap-2 text-sm text-white bg-primary hover:bg-primary-dark
                                  font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
                      <Download size={16} />
                      Download
                    </a>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title="Review Reports" 
      showBack 
      onBackClick={() => navigate('/doctor-dashboard')}
    >
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Patient Shared Records</h2>
          <p className="text-text-secondary mt-1">Review medical reports shared by your active patients</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-text-secondary mt-4">Loading patient list...</p>
          </div>
        ) : patients.length === 0 ? (
          <Card className="text-center py-20 bg-white border-none shadow-soft max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No Shared Records Yet</h3>
            <p className="text-text-secondary max-w-sm mx-auto">
              Patients will appear here once they grant you access to their medical records and reports.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map(p => (
              <Card key={p.id}
                   className="bg-white border-none shadow-soft p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  {getAvatar(p.profile_image, p.name)}
                  <div>
                    <p className="font-bold text-text-primary text-lg">{p.name}</p>
                    <p className="text-primary text-sm font-semibold">Active Patient</p>
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Reports</p>
                    <p className="font-bold text-text-primary text-sm">
                      {p.records_shared} Shared
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Last Appt</p>
                    <p className="font-bold text-text-primary text-sm truncate">
                      {p.last_appointment ? p.last_appointment.split(' ').slice(0, 3).join(' ') : "—"}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => setSelected(p)}
                  className="w-full bg-primary hover:bg-primary-dark text-white
                             font-bold py-3.5 rounded-2xl flex items-center
                             justify-center gap-2 transition-all shadow-sm active:transform active:scale-[0.98]"
                >
                  Review Records
                  <ChevronRight size={18} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScreenContainer>
  );
}
