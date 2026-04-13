import React from 'react';
import { Activity, Shield, Heart, Globe } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { useProfile } from '../context/ProfileContext';

export function AboutAppScreen() {
  const { profile } = useProfile();
  const role = profile?.role || 'patient';

  const getRoleSpecificContent = () => {
    switch (role) {
      case 'doctor':
        return {
          title: "Provider-Focused Efficiency",
          desc: "Streamlined tools to manage your appointments, patient records, and digital prescriptions effortlessly."
        };
      case 'admin':
        return {
          title: "System Integrity & Oversight",
          desc: "Comprehensive dashboards for user verification, platform monitoring, and system-wide security auditing."
        };
      default:
        return {
          title: "Patient-Centered Experience",
          desc: "Designed to simplify appointments, consultations, records, and follow-ups."
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  return (
    <ScreenContainer title="About" showBack>
      <div className="px-6 py-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-xl mb-6 transform rotate-3">
          <Activity size={48} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-1">
          TeleHealth+
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Version 1.0.0
        </p>

        <div className="w-full space-y-6 text-left">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary flex-shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">
                Accessible Healthcare
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Connect with trusted healthcare services anytime, anywhere.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-success flex-shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Secure & Private</h3>
              <p className="text-sm text-text-secondary mt-1">
                Your data, consultations, and records are protected with secure access controls.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-warning flex-shrink-0">
              <Heart size={20} />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">{roleContent.title}</h3>
              <p className="text-sm text-text-secondary mt-1">
                {roleContent.desc}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 w-full text-center space-y-4">
          <button className="text-sm font-medium text-primary hover:underline">
            Terms of Service
          </button>
          <div className="text-xs text-gray-400">
            © 2026 TeleHealth+ Inc. All rights reserved.
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}
