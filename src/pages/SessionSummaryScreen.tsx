import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, FileText, Calendar, Star } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MedicalIllustration } from '../components/illustrations/MedicalIllustration';
export function SessionSummaryScreen() {
  const navigate = useNavigate();
  const summary = {
    doctor: 'Dr. Sarah Smith',
    specialty: 'Cardiologist',
    duration: '28 minutes',
    date: 'Oct 24, 2023',
    time: '10:00 AM',
    prescriptionReady: true
  };
  return (
    <ScreenContainer className="bg-white" noScroll>
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center">
          <MedicalIllustration type="success" className="w-40 h-40 mb-6" />

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Consultation Complete
          </h1>
          <p className="text-text-secondary mb-8 text-center">
            Your consultation has been successfully completed.
          </p>

          <Card className="w-full mb-6">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                <User size={28} />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">
                  {summary.doctor}
                </h3>
                <p className="text-sm text-text-secondary">
                  {summary.specialty}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={16} />
                  <span>Date</span>
                </div>
                <span className="font-medium text-text-primary">
                  {summary.date}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock size={16} />
                  <span>Duration</span>
                </div>
                <span className="font-medium text-text-primary">
                  {summary.duration}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <FileText size={16} />
                  <span>Prescription</span>
                </div>
                <Badge
                  variant={summary.prescriptionReady ? 'success' : 'warning'}>

                  {summary.prescriptionReady ? 'Ready' : 'Pending'}
                </Badge>
              </div>
            </div>
          </Card>

          <div className="w-full space-y-3">
            {summary.prescriptionReady &&
            <Button
              fullWidth
              onClick={() => navigate('/prescription/1')}
              icon={<FileText size={18} />}>

                View Prescription
              </Button>
            }

            <Button
              fullWidth
              variant="secondary"
              icon={<Star size={18} />}
              onClick={() => navigate('/rate-doctor')}>

              Rate Doctor
            </Button>

            <Button
              fullWidth
              variant="outline"
              onClick={() => navigate('/book-appointment')}>

              Book Follow-up
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigate('/patient-dashboard')}
          className="mt-4">

          Back to Dashboard
        </Button>
      </div>
    </ScreenContainer>);

}