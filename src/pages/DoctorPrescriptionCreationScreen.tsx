import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Trash2,
  Check,
  Pill } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import socketService from '../services/consultationSocket';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  timing: ('Morning' | 'Afternoon' | 'Night')[];
}

export function DoctorPrescriptionCreationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment;
  
  const [mode, setMode] = useState<'common' | 'manual'>('common');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  useEffect(() => {
    if (!appointment) {
      navigate('/doctor-dashboard');
      return;
    }
    socketService.connect();
    socketService.joinRoom(`consultation_${appointment.id}`);
  }, [appointment, navigate]);

  const commonMedicines = [
    { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' },
    { name: 'Ibuprofen', dosage: '400mg', frequency: 'Three times daily', duration: '3 days' },
    { name: 'Amoxicillin', dosage: '250mg', frequency: 'Three times daily', duration: '7 days' }
  ];

  const addMedicine = (med: any) => {
    const newMed: Medicine = {
      id: Date.now().toString(),
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: 'After food',
      timing: ['Morning', 'Night']
    };
    setMedicines([...medicines, newMed]);
    setSearchQuery('');
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter((med) => med.id !== id));
  };

  const handleSave = async () => {
    try {
      const docId = localStorage.getItem('user_id');
      socketService.emit('prescription_ready', { 
        appointment_id: appointment.id,
        doctor_id: docId,
        prescription_id: Date.now()
      });

      // Show rating popup automatically after successful prescription creation (avoiding mid-call disruption)
      try {
        const res = await fetch(`/api/doctor/${docId}/ratings`);
        if (res.ok) {
          const ratings = await res.json();
          if (ratings.length > 0) {
            const avg = (ratings.reduce((acc: any, r: any) => acc + r.rating, 0) / ratings.length).toFixed(1);
            alert(`✅ Prescription Issued Successfully!\n\nYou currently have ${ratings.length} patient ratings with an average score of ${avg} Stars! ⭐`);
          } else {
            alert("✅ Prescription Issued Successfully!");
          }
        }
      } catch (e) {
        // Fallback popup if rating fetch fails
        alert("✅ Prescription Issued Successfully!");
      }

      navigate('/doctor-dashboard');
    } catch (err) {
      console.error("Failed to save prescription", err);
    }
  };

  if (!appointment) return null;

  return (
    <ScreenContainer title="Create Prescription" showBack className="bg-white">
      <div className="px-6 py-10 pb-12 space-y-10 max-w-lg mx-auto">
        <Card className="bg-gray-900 border-none shadow-2xl p-6 rounded-[32px] text-white">
          <div className="flex items-center gap-5">
             <div className="relative">
                <img 
                   src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment.patient_name || 'Patient'}`}
                   className="w-16 h-16 rounded-full bg-white/20 border-2 border-primary/40 shadow-xl"
                   alt="Patient"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
             </div>
             <div>
                <h3 className="text-xl font-black">{appointment.patient_name}</h3>
                <p className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-widest">Case Profile #{appointment.id} • Verified Patient</p>
             </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Clinical Diagnosis</h3>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Type clinical diagnosis here..."
            className="w-full h-32 p-6 rounded-3xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-inner text-sm font-medium leading-relaxed" />
        </div>

        <div className="space-y-6">
           <div className="flex justify-between items-center bg-gray-100/50 p-1.5 rounded-2xl">
              <button onClick={() => setMode('common')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'common' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>Standard DB</button>
              <button onClick={() => setMode('manual')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>Manual Entry</button>
           </div>

           {mode === 'common' && (
              <div className="relative group">
                 <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                 <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Medicines..."
                    className="w-full h-14 pl-14 pr-6 rounded-full border-2 border-primary/10 bg-white focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-sm text-sm font-bold" />
                 
                 {searchQuery && (
                    <div className="absolute top-full left-0 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 mt-3 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                       {commonMedicines
                          .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((med, i) => (
                             <button key={i} onClick={() => addMedicine(med)} className="w-full text-left px-8 py-4 hover:bg-primary/5 border-b border-gray-50 last:border-none flex justify-between items-center group">
                                <span className="font-bold text-gray-900 group-hover:text-primary">{med.name}</span>
                                <Badge className="bg-gray-100 text-gray-400 font-bold border-none uppercase text-[8px]">{med.dosage}</Badge>
                             </button>
                          ))
                       }
                    </div>
                 )}
              </div>
           )}

           <div className="space-y-4">
              {medicines.map((med) => (
                <Card key={med.id} className="p-0 border-2 border-gray-50 overflow-hidden rounded-[32px] shadow-sm hover:shadow-md transition-shadow">
                   <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Pill size={18} />
                         </div>
                         <input
                            value={med.name}
                            onChange={(e) => {
                               const newMeds = [...medicines];
                               newMeds.find(m => m.id === med.id)!.name = e.target.value;
                               setMedicines(newMeds);
                            }}
                            className="bg-transparent font-black text-gray-900 text-sm focus:outline-none w-full"
                         />
                      </div>
                      <button onClick={() => removeMedicine(med.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center">
                         <Trash2 size={16} />
                      </button>
                   </div>
                   <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Dosage</label>
                         <input value={med.dosage} onChange={e => {
                               const newMeds = [...medicines];
                               newMeds.find(m => m.id === med.id)!.dosage = e.target.value;
                               setMedicines(newMeds);
                            }} className="w-full bg-gray-50 h-10 px-4 rounded-xl text-xs font-bold focus:bg-white outline-none border border-transparent focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Duration</label>
                         <input value={med.duration} onChange={e => {
                               const newMeds = [...medicines];
                               newMeds.find(m => m.id === med.id)!.duration = e.target.value;
                               setMedicines(newMeds);
                            }} className="w-full bg-gray-50 h-10 px-4 rounded-xl text-xs font-bold focus:bg-white outline-none border border-transparent focus:border-primary" />
                      </div>
                   </div>
                </Card>
              ))}
           </div>
        </div>

        <div className="sticky bottom-4 left-0 right-0 z-20">
           <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[40px] shadow-2xl border border-gray-100 flex gap-4 max-w-md mx-auto">
              <Button variant="outline" className="flex-1 py-4 font-black uppercase text-[10px] tracking-[0.2em]" onClick={() => navigate(-1)}>Hold Case</Button>
              <Button className="flex-[2] py-4 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/30" onClick={handleSave} disabled={medicines.length === 0 || !diagnosis} icon={<Check size={18} />}>Issue Prescription</Button>
           </div>
        </div>
      </div>
    </ScreenContainer>
  );
}
