import { MessageSquare, Mail, Phone, ChevronDown } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
const SUPPORT_NUMBER = "+18001234567";

export function HelpSupportScreen() {
  const handleCallSupport = () => {
    if (!SUPPORT_NUMBER) {
      alert("Support number unavailable");
      return;
    }
    window.location.href = `tel:${SUPPORT_NUMBER}`;
  };

  const faqs = [
  {
    q: 'How do I book an appointment?',
    a: "Go to the dashboard and click on 'Book Appointment'. Select a doctor, date, and time."
  },
  {
    q: 'Can I cancel my appointment?',
    a: "Yes, you can cancel appointments from the 'History' or 'Appointments' tab up to 1 hour before."
  },
  {
    q: 'Is my medical data safe?',
    a: 'Absolutely. We use end-to-end encryption and comply with all medical data privacy regulations.'
  }];

  return (
    <ScreenContainer title="Help & Support" showBack>
      <div className="px-6 py-6 space-y-6">
        {/* Contact Options */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col items-center justify-center p-4 gap-2 hover:border-primary/50 cursor-pointer transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-primary">
              <MessageSquare size={24} />
            </div>
            <span className="font-bold text-text-primary text-sm">
              Live Chat
            </span>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 gap-2 hover:border-primary/50 cursor-pointer transition-colors">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-success">
              <Mail size={24} />
            </div>
            <span className="font-bold text-text-primary text-sm">
              Email Us
            </span>
          </Card>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="font-bold text-text-primary mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, index) =>
            <Card key={index} className="p-4 cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-text-primary text-sm">
                    {faq.q}
                  </h4>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {faq.a}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Call Support */}
        <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
              <Phone size={20} />
            </div>
            <div>
              <h4 className="font-bold text-text-primary text-sm">
                Emergency?
              </h4>
              <p className="text-xs text-text-secondary">
                Call our 24/7 support line
              </p>
            </div>
          </div>
          <Button onClick={handleCallSupport} className="h-9 text-xs">
            Call Now
          </Button>
        </div>
      </div>
    </ScreenContainer>);

}