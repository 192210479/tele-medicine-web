import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Database, Activity, Share2, Lock, ShieldCheck } from 'lucide-react';

export function PrivacyPolicyScreen() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Data Collection",
      icon: <Database className="text-secondary" size={20} />,
      content: "We collect personal identifiers (name, email, phone), demographic information (age, gender), and medical history data you choose to share. We also collect device information and platform interaction logs for security and performance monitoring."
    },
    {
      title: "Data Usage",
      icon: <Activity className="text-secondary" size={20} />,
      content: "Your data is used to facilitate medical consultations, manage appointment bookings, generate digital prescriptions, and send health-related notifications. We use anonymized data to improve our platform services."
    },
    {
      title: "Data Sharing Policy",
      icon: <Share2 className="text-secondary" size={20} />,
      content: "We share your medical data only with the doctors you choose to consult with. We do not sell your personal data to third parties. Some data may be shared with regulatory authorities if required by law."
    },
    {
      title: "Security Practices",
      icon: <Lock className="text-secondary" size={20} />,
      content: "All sensitive medical data is encrypted at rest and in transit using industry-standard protocols. We employ multi-factor authentication and regular security audits to protect your information from unauthorized access."
    }
  ];

  return (
    <ScreenContainer title="Privacy Policy" showBack>
      <div className="flex flex-col min-h-full bg-surface">
        <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-secondary/10 rounded-full mb-4">
                <ShieldCheck className="text-secondary" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Privacy Policy</h2>
              <p className="text-sm text-text-secondary">Your privacy and data security are our highest priority.</p>
            </div>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      {section.icon}
                    </div>
                    <h3 className="font-bold text-text-primary text-lg">{section.title}</h3>
                  </div>
                  <p className="text-text-secondary leading-relaxed pl-12">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-8">
              <h4 className="text-sm font-bold text-blue-800 mb-1">HIPAA Compliance</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Our practices are designed to meet or exceed HIPAA (Health Insurance Portability and Accountability Act) standards for the protection of electronically protected health information (ePHI).
              </p>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <p className="text-xs text-text-secondary text-center">
                Last updated: April 12, 2026. For questions, contact privacy@telehealthplus.com
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => navigate(-1)}>
            Accept & Continue
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}
