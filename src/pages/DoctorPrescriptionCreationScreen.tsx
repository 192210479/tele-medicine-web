import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  Check,
  Pill,
  AlertCircle } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut } from '../services/api';
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
  const { userId } = useAuth();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointment_id');
  const [appointment, setAppointment] = useState<any>(null);
  const [mode, setMode] = useState<'common' | 'manual'>('common');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const data = await apiGet(`/api/appointment/${appointmentId}`);
      setAppointment(data);
    } catch (e) {
      console.error(e);
    }
  };
  const commonMedicines = [
  {
    name: 'Paracetamol',
    dosage: '500mg',
    frequency: 'Twice daily',
    duration: '5 days'
  },
  {
    name: 'Ibuprofen',
    dosage: '400mg',
    frequency: 'Three times daily',
    duration: '3 days'
  },
  {
    name: 'Amoxicillin',
    dosage: '250mg',
    frequency: 'Three times daily',
    duration: '7 days'
  }];

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
  const toggleTiming = (
  id: string,
  time: 'Morning' | 'Afternoon' | 'Night') =>
  {
    setMedicines(
      medicines.map((m) => {
        if (m.id === id) {
          const newTiming = m.timing.includes(time) ?
          m.timing.filter((t) => t !== time) :
          [...m.timing, time];
          return {
            ...m,
            timing: newTiming
          };
        }
        return m;
      })
    );
  };
  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter((med) => med.id !== id));
  };
  const handleSave = async () => {
    try {
      // 1. Create prescription
      const presc = await apiPost(`/api/prescription/create/${appointmentId}`, {
         user_id: userId,
         role: 'doctor',
         diagnosis: diagnosis,
         advice: diagnosis // Using diagnosis as advice as per UI
      });
      const prescriptionId = presc.prescription_id;

      // 2. Add medicines
      for (const med of medicines) {
        await apiPost(`/api/prescription/${prescriptionId}/add-medicine`, {
          user_id: userId,
          role: 'doctor',
          name: med.name,
          dosage: med.dosage,
          frequency: med.timing.join(', '), // mapping timing to frequency
          duration: med.duration,
          instructions: med.instructions
        });
      }

      // 3. Mark ready
      await apiPut(`/api/prescription/${prescriptionId}/mark-ready`, {
        user_id: userId,
        role: 'doctor'
      });

      alert("Prescription sent to patient");
      navigate('/doctor-appointments');
    } catch (e: any) {
      console.error("Failed to save prescription", e);
      alert(e.message || "Failed to save prescription");
    }
  };
  return (
    <ScreenContainer title="New Prescription" showBack className="bg-gray-50">
      <div className="px-6 py-6 pb-8 space-y-8">
        {/* Patient Header */}
        <Card className="bg-white border-none shadow-sm flex items-center gap-4 p-6">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-xl uppercase">
            {appointment?.patient_name?.slice(0, 2) || '...'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{appointment?.patient_name || 'Loading...'}</h3>
            <p className="text-base text-gray-500">Dr. {appointment?.doctor_name} • {appointment?.date} • {appointment?.time}</p>
          </div>
        </Card>

        {/* Diagnosis Section */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Diagnosis
          </h3>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter clinical diagnosis..."
            className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none shadow-sm text-base" />

        </div>

        {/* Medicine Selection */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              Medicines
            </h3>
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setMode('common')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${mode === 'common' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>

                Search
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>

                Manual
              </button>
            </div>
          </div>

          {mode === 'common' ?
          <div className="relative mb-6">
              <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand or generic name..."
              className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm text-base" />

              {searchQuery &&
            <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 mt-2 z-20 overflow-hidden">
                  {commonMedicines.
              filter((m) =>
              m.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).
              map((med, i) =>
              <button
                key={i}
                onClick={() => addMedicine(med)}
                className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-none flex justify-between items-center">

                        <span className="font-medium text-gray-900 text-base">
                          {med.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {med.dosage}
                        </span>
                      </button>
              )}
                </div>
            }
            </div> :

          <Button
            variant="outline"
            fullWidth
            onClick={() =>
            addMedicine({
              name: '',
              dosage: '',
              frequency: '',
              duration: ''
            })
            }
            icon={<Plus size={20} />}
            className="mb-6">

              Add Custom Medicine
            </Button>
          }
        </div>

        {/* Medicine Cards List */}
        <div className="space-y-6">
          {medicines.map((med) =>
          <Card
            key={med.id}
            className="p-0 overflow-hidden border-none shadow-md">

              <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-start">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                    <Pill size={20} />
                  </div>
                  <input
                  value={med.name}
                  onChange={(e) => {
                    const newMeds = [...medicines];
                    newMeds.find((m) => m.id === med.id)!.name =
                    e.target.value;
                    setMedicines(newMeds);
                  }}
                  className="bg-transparent font-bold text-gray-900 focus:outline-none text-lg w-full"
                  placeholder="Medicine Name" />

                </div>
                <button
                onClick={() => removeMedicine(med.id)}
                className="text-gray-400 hover:text-red-500 p-2">

                  <Trash2 size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Dosage
                    </label>
                    <input
                    value={med.dosage}
                    onChange={(e) => {
                      const newMeds = [...medicines];
                      newMeds.find((m) => m.id === med.id)!.dosage =
                      e.target.value;
                      setMedicines(newMeds);
                    }}
                    className="w-full mt-2 p-3 bg-gray-50 rounded-lg text-base font-medium focus:bg-white focus:ring-1 focus:ring-primary border-none"
                    placeholder="e.g. 500mg" />

                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Duration
                    </label>
                    <input
                    value={med.duration}
                    onChange={(e) => {
                      const newMeds = [...medicines];
                      newMeds.find((m) => m.id === med.id)!.duration =
                      e.target.value;
                      setMedicines(newMeds);
                    }}
                    className="w-full mt-2 p-3 bg-gray-50 rounded-lg text-base font-medium focus:bg-white focus:ring-1 focus:ring-primary border-none"
                    placeholder="e.g. 5 days" />

                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">
                    Timing
                  </label>
                  <div className="flex gap-3">
                    {['Morning', 'Afternoon', 'Night'].map((t) =>
                  <button
                    key={t}
                    onClick={() => toggleTiming(med.id, t as any)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${med.timing.includes(t as any) ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>

                        {t}
                      </button>
                  )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Instructions
                  </label>
                  <input
                  value={med.instructions}
                  onChange={(e) => {
                    const newMeds = [...medicines];
                    newMeds.find((m) => m.id === med.id)!.instructions =
                    e.target.value;
                    setMedicines(newMeds);
                  }}
                  className="w-full mt-2 p-3 bg-gray-50 rounded-lg text-base text-gray-600 focus:bg-white focus:ring-1 focus:ring-primary border-none"
                  placeholder="e.g. Take after food" />

                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Smart Suggestion */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
          <AlertCircle size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-bold text-primary mb-1">AI Suggestion</p>
            <p className="text-sm text-blue-800">
              Based on diagnosis "Viral Fever", consider adding Multivitamins
              for faster recovery.
            </p>
            <button className="text-sm font-bold text-primary mt-2 hover:underline">
              Add Multivitamin
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-20 mt-8 rounded-xl">
          <div className="flex gap-4 max-w-md mx-auto w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}>

              Preview
            </Button>
            <Button
              className="flex-[2] shadow-lg shadow-primary/30"
              onClick={handleSave}
              disabled={medicines.length === 0 || !diagnosis}
              icon={<Check size={20} />}>

              Save & Send
            </Button>
          </div>
        </div>
      </div>
    </ScreenContainer>);

}