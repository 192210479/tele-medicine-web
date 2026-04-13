import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Calendar } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { MedicalIllustration } from '../components/illustrations/MedicalIllustration';
export function MissedAppointmentScreen() {
  const navigate = useNavigate();
  return (
    <ScreenContainer className="bg-white" noScroll>
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <MedicalIllustration type="empty" className="w-48 h-48 mb-6" />

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Missed Appointment
          </h1>
          <p className="text-text-secondary mb-8 max-w-xs mx-auto">
            It looks like you missed your scheduled consultation. Don't worry,
            you can reschedule.
          </p>

          <div className="w-full space-y-3">
            <Button
              fullWidth
              onClick={() => navigate('/book-appointment')}
              icon={<Calendar size={18} />}>
              
              Reschedule Now
            </Button>

            <Button
              fullWidth
              variant="outline"
              onClick={() => navigate('/help-support')}
              icon={<Phone size={18} />}>
              
              Contact Support
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
