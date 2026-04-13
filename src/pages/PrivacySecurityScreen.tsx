import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Lock, Smartphone, FileText, Trash2, HelpCircle } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';

export function PrivacySecurityScreen() {
  const navigate = useNavigate();

  const menuItems = [
    { label: "Change Password",    icon: <Lock size={20} className="text-primary" />, path: "/change-password", desc: "Change your account login password" },
    { label: "Login Activity",     icon: <Smartphone size={20} className="text-secondary" />, path: "/login-activity", desc: "Review your recent sign-ins" },
    { label: "Device Management",  icon: <Shield size={20} className="text-blue-500" />, path: "/device-management", desc: "Manage devices linked to your account" },
    { label: "Data Privacy", icon: <FileText size={20} className="text-gray-500" />, path: "/data-policy", desc: "Our terms and information handling" },
  ];

  return (
    <ScreenContainer title="Privacy & Security" showBack className="bg-gray-50 pb-8">
      <div className="p-6 max-w-2xl mx-auto space-y-8">
        
        <header className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
             <Shield size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Account Protection</h2>
          <p className="text-text-secondary text-sm">Security settings and privacy preferences</p>
        </header>

        <section className="space-y-4">
          {menuItems.map((item) => (
            <Card 
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white border-none shadow-soft hover:shadow-md transition-all p-5 flex items-center gap-5 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-text-primary text-base">{item.label}</p>
                <p className="text-text-secondary text-xs">{item.desc}</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
            </Card>
          ))}
        </section>

        <section className="pt-8 border-t border-gray-100">
           <Card 
              onClick={() => navigate('/delete-account')}
              className="bg-red-50/50 border-none shadow-none p-5 flex items-center gap-5 cursor-pointer group hover:bg-red-50 transition-all border-2 border-dashed border-red-100"
            >
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                <Trash2 size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-600 text-base">Delete Account</p>
                <p className="text-red-400 text-xs">Permanently remove your account and all data</p>
              </div>
              <ChevronRight size={20} className="text-red-200" />
            </Card>
        </section>

        <footer className="text-center space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-gray-100 inline-flex items-center gap-3 text-text-secondary">
             <HelpCircle size={18} className="text-primary" />
             <p className="text-xs font-medium text-left">
                Manage your account security and privacy settings. <br />
                For more help, <span className="text-primary font-bold cursor-pointer hover:underline">contact support.</span>
             </p>
          </div>
        </footer>

      </div>
    </ScreenContainer>
  );
}
