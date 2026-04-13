import { useNavigate } from 'react-router-dom';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { useProfile } from '../context/ProfileContext';

export function DataPolicyScreen() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const role = profile?.role || 'patient';

  const getContent = () => {
    switch (role) {
      case 'doctor':
        return {
          collect: "We collect professional data including your doctor profile, specialization, experience, and availability. We also process your appointment schedule, consultation notes, prescriptions issued, and any medical reports or documents uploaded during consultations.",
          use: "Your information is used to manage your professional presence, facilitate appointments, enable clinical documentation, and maintain communication with patients under your care.",
          access: "Administrators may access your profile for verification, auditing, and platform support purposes."
        };
      case 'admin':
        return {
          collect: "As an administrator, we collect your professional credentials and system interaction logs. This includes data related to user management, appointment oversight, and verification workflows.",
          use: "We use this data for platform monitoring, security auditing, handling complaints or support requests, and ensuring the overall integrity of the TeleHealth+ system.",
          access: "Platform-level access is strictly monitored and logged for security and accountability."
        };
      default: // patient
        return {
          collect: "We collect your profile data, appointment history, prescriptions, consultation messages, and medical records. We also process payment information, medication reminders, and notification preferences.",
          use: "Your data is used to provide clinical services, process payments, send health reminders, and facilitate secure communication with your healthcare providers.",
          access: "Authorized healthcare providers you consult with have controlled access to your relevant medical history and records."
        };
    }
  };

  const content = getContent();

  return (
    <ScreenContainer title="Data & Privacy" showBack>
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-text-secondary space-y-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Last updated: April 11, 2026</p>
            <h3 className="text-xl font-bold text-text-primary">Privacy protection is our priority</h3>
          </div>

          <section className="space-y-3">
            <h4 className="font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
              Information We Collect
            </h4>
            <p className="leading-relaxed">
              {content.collect}
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
              How We Use Your Information
            </h4>
            <p className="leading-relaxed">
              {content.use}
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
              Data Security
            </h4>
            <p className="leading-relaxed">
              All data is encrypted, stored securely according to applicable platform security standards, and protected with stringent access controls to prevent unauthorized access.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">4</span>
              Your Rights
            </h4>
            <p className="leading-relaxed">
              You have the right to access, update, and manage your data at any time. You can also request the deletion of your account and associated personal information through the app settings.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">5</span>
              Account-Specific Access
            </h4>
            <p className="leading-relaxed">
              {content.access}
            </p>
          </section>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <Button fullWidth onClick={() => navigate(-1)}>I Understand</Button>
        </div>
      </div>
    </ScreenContainer>
  );
}
