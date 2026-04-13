import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { FileText, ShieldAlert, Users, AlertCircle, CalendarX } from 'lucide-react';

export function TermsAndConditionsScreen() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. App Usage Rules",
      icon: <FileText className="text-primary" size={20} />,
      content: "Users must be at least 18 years old to use this service. You agree to use TeleHealth+ only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the app."
    },
    {
      title: "2. User Responsibilities",
      icon: <Users className="text-primary" size={20} />,
      content: "You are responsible for maintaining the confidentiality of your account and password. You must provide accurate and complete information during registration and maintain its accuracy."
    },
    {
      title: "3. Doctor-Patient Interaction Disclaimer",
      icon: <ShieldAlert className="text-primary" size={20} />,
      content: "TeleHealth+ provides a platform for telemedicine consultations. While we verify doctor credentials, the platform itself does not provide medical advice. Consultations are between the patient and the doctor directly."
    },
    {
      title: "4. Liability Limitations",
      icon: <AlertCircle className="text-primary" size={20} />,
      content: "TeleHealth+ is not liable for any direct, indirect, or consequential damages arising out of your use of the service. We do not guarantee 100% uptime or that the service will be error-free."
    },
    {
      title: "5. Appointment & Cancellation Policy",
      icon: <CalendarX className="text-primary" size={20} />,
      content: "Appointments must be cancelled at least 4 hours in advance. Failure to attend a scheduled consultation without prior notice may result in a 'No-Show' fee or suspension of booking privileges."
    }
  ];

  return (
    <ScreenContainer title="Terms & Conditions" showBack>
      <div className="flex flex-col min-h-full bg-surface">
        <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Terms of Service</h2>
              <p className="text-sm text-text-secondary">Please read these terms carefully before using our platform.</p>
            </div>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {section.icon}
                    </div>
                    <h3 className="font-bold text-text-primary text-lg">{section.title}</h3>
                  </div>
                  <p className="text-text-secondary leading-relaxed pl-12 border-l-2 border-gray-100 italic md:not-italic">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-gray-100">
              <p className="text-xs text-text-secondary text-center">
                By clicking 'Accept & Continue', you agree to abide by these terms and conditions. 
                Last updated: April 12, 2026
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button className="flex-1" onClick={() => navigate(-1)}>
            Accept & Continue
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}
