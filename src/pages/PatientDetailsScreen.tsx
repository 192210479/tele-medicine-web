import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  FileText,
  Activity,
  Video,
  Clock,
  ChevronRight,
  AlertCircle,
  Droplet } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
export function PatientDetailsScreen() {
  const navigate = useNavigate();
  const patient = {
    name: 'Alice Johnson',
    age: 28,
    gender: 'Female',
    bloodGroup: 'O+',
    image:
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300&h=300',
    symptoms: ['Severe Headache', 'Nausea', 'Sensitivity to Light'],
    conditions: ['Migraine', 'Seasonal Allergies'],
    history: [
    {
      date: 'Oct 10, 2023',
      diagnosis: 'Viral Fever',
      doctor: 'Dr. Smith'
    },
    {
      date: 'Sep 15, 2023',
      diagnosis: 'Regular Checkup',
      doctor: 'Dr. Wilson'
    }]

  };
  return (
    <ScreenContainer title="Patient Profile" showBack className="bg-gray-50">
      {/* Header Profile */}
      <div className="bg-white px-6 py-8 rounded-b-[32px] shadow-sm mb-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <img
              src={patient.image}
              alt={patient.name}
              className="w-24 h-24 rounded-2xl object-cover shadow-md" />
            
            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-lg shadow-sm">
              <Badge variant="info" className="text-xs px-2 py-1">
                New
              </Badge>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-500 text-base mb-4">Patient ID: #8832</p>
            <div className="flex gap-3">
              <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-sm font-bold">
                {patient.age} Years
              </span>
              <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-sm font-bold">
                {patient.gender}
              </span>
            </div>
          </div>
        </div>

        {/* Vitals Row */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center">
            <Droplet size={24} className="text-red-500 mb-2" />
            <span className="text-sm text-red-400 font-bold uppercase">
              Blood
            </span>
            <span className="text-xl font-bold text-red-600">
              {patient.bloodGroup}
            </span>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center">
            <Activity size={24} className="text-blue-500 mb-2" />
            <span className="text-sm text-blue-400 font-bold uppercase">
              Height
            </span>
            <span className="text-xl font-bold text-blue-600">165cm</span>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center">
            <Activity size={24} className="text-green-500 mb-2" />
            <span className="text-sm text-green-400 font-bold uppercase">
              Weight
            </span>
            <span className="text-xl font-bold text-green-600">60kg</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8 pb-8">
        {/* Current Symptoms */}
        <Card className="border-none shadow-md overflow-hidden">
          <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-2">
            <AlertCircle size={20} className="text-orange-600" />
            <h3 className="font-bold text-orange-800 text-base uppercase tracking-wide">
              Reported Symptoms
            </h3>
          </div>
          <div className="p-5 flex flex-wrap gap-3">
            {patient.symptoms.map((symptom, index) =>
            <span
              key={index}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
              
                {symptom}
              </span>
            )}
          </div>
        </Card>

        {/* Medical History Timeline */}
        <div>
          <h3 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4 ml-1">
            History
          </h3>
          <div className="space-y-0 relative pl-5">
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
            {patient.history.map((record, index) =>
            <div key={index} className="flex gap-6 mb-6 relative">
                <div className="w-5 h-5 rounded-full bg-primary border-4 border-white shadow-sm flex-shrink-0 z-10 mt-1" />
                <Card className="flex-1 p-4 border-none shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 text-lg">
                      {record.diagnosis}
                    </h4>
                    <span className="text-sm text-gray-400">{record.date}</span>
                  </div>
                  <p className="text-sm text-gray-500">{record.doctor}</p>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Reports */}
        <div>
          <h3 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4 ml-1">
            Recent Reports
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[1, 2].map((i) =>
            <div
              key={i}
              className="min-w-[180px] bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
              
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-900 truncate">
                    Blood Test
                  </p>
                  <p className="text-sm text-gray-400">24 Oct • PDF</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Button */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 mt-8 rounded-xl">
          <Button
            fullWidth
            onClick={() => navigate('/doctor-video-call')}
            className="shadow-lg shadow-primary/30 h-14 text-lg max-w-md mx-auto"
            icon={<Video size={22} />}>
            
            Start Consultation
          </Button>
        </div>
      </div>
    </ScreenContainer>);

}
