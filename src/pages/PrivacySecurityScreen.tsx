import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Smartphone,
  Shield,
  FileText,
  Trash2,
  ChevronRight } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
export function PrivacySecurityScreen() {
  const navigate = useNavigate();
  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    danger = false





  }: {icon: any;label: string;onClick: () => void;danger?: boolean;}) =>
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">

      <div className="flex items-center gap-3">
        <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}`}>

          <Icon size={16} />
        </div>
        <span
        className={`font-medium ${danger ? 'text-red-500' : 'text-text-primary'}`}>

          {label}
        </span>
      </div>
      <ChevronRight size={18} className="text-gray-400" />
    </button>;

  return (
    <ScreenContainer title="Privacy & Security" showBack>
      <div className="px-6 py-6">
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <MenuItem
            icon={Lock}
            label="Change Password"
            onClick={() => navigate('/change-password')} />

          <MenuItem
            icon={Smartphone}
            label="Login Activity"
            onClick={() => navigate('/login-activity')} />

          <MenuItem
            icon={Shield}
            label="Device Management"
            onClick={() => navigate('/device-management')} />

          <MenuItem
            icon={FileText}
            label="Data & Privacy Policy"
            onClick={() => navigate('/data-policy')} />

        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-soft overflow-hidden">
          <MenuItem
            icon={Trash2}
            label="Delete Account"
            onClick={() => navigate('/delete-account')}
            danger />

        </div>

        <p className="text-xs text-text-secondary mt-4 px-2">
          Manage your account security and privacy settings. For more help,
          contact support.
        </p>
      </div>
    </ScreenContainer>);

}