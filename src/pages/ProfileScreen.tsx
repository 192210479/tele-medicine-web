import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  HelpCircle,
  Info,
  Edit,
  Globe,
  Moon,
  Fingerprint,
  CreditCard,
  AlertTriangle } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function ProfileScreen() {
  const { user, logout, role, userId } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [profileName, setProfileName] = useState(user?.name || 'User');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  useEffect(() => {
    if (userId && (role === 'patient' || role === 'doctor' || role === 'admin')) {
      loadProfile();
    }
  }, [userId, role]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/profile?user_id=${userId}&role=${role}`);
      const profile = await response.json();
      
      if (profile) {
        const nameToSet = profile.full_name || 'User';
        setProfileName(role === 'doctor' && !nameToSet.startsWith('Dr.') ? `Dr. ${nameToSet}` : nameToSet);
        setProfileEmail(profile.email || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    danger = false





  }: {icon: any;label: string;onClick?: () => void;danger?: boolean;}) =>
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">

      <div className="flex items-center gap-3">
        <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}`}>

          <Icon size={18} />
        </div>
        <span
        className={`font-medium ${danger ? 'text-red-600' : 'text-text-primary'}`}>

          {label}
        </span>
      </div>
      <ChevronRight size={18} className="text-gray-400" />
    </button>;

  const ToggleItem = ({
    icon: Icon,
    label,
    checked,
    onChange





  }: {icon: any;label: string;checked: boolean;onChange: () => void;}) =>
  <div className="w-full flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
          <Icon size={18} />
        </div>
        <span className="font-medium text-text-primary">{label}</span>
      </div>
      <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-gray-300'}`}>

        <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'left-6' : 'left-1'}`} />

      </button>
    </div>;

  return (
    <ScreenContainer className="pb-8">
      {/* Unified Profile Header - no split blue section */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300"
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-gray-100" />

            <button
              onClick={() => navigate('/edit-profile')}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">

              <Edit size={12} className="text-white" />
            </button>
          </div>
            <div className="flex-1">
            <h1 id="profileName" className="text-xl font-bold text-text-primary">
              {profileName}
            </h1>
            <p className="text-sm text-text-secondary">{profileEmail}</p>
            <Badge variant="info" className="mt-1">
              {role === 'patient' ? '👤 Patient' :
               role === 'doctor' ? '🩺 Doctor' :
               role === 'admin' ? '🛡️ Admin' : '👤 User'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4 space-y-6">
        {/* Account Section */}
        <Card className="p-0 overflow-hidden divide-y divide-gray-50">
          <MenuItem
            icon={User}
            label="Edit Profile"
            onClick={() => navigate('/edit-profile')} />

          <MenuItem
            icon={CreditCard}
            label="Payments & Billing"
            onClick={() => navigate('/payments-billing')} />

          <MenuItem
            icon={Bell}
            label="Notifications"
            onClick={() => navigate('/notifications')} />

          <MenuItem
            icon={Shield}
            label="Privacy & Security"
            onClick={() => navigate('/privacy-security')} />

        </Card>

        {/* Settings Section */}
        <Card className="p-0 overflow-hidden divide-y divide-gray-50">
          <MenuItem icon={Globe} label="Language" onClick={() => {}} />
          <ToggleItem
            icon={Moon}
            label="Dark Mode"
            checked={theme === 'dark'}
            onChange={toggleTheme} />

          <ToggleItem
            icon={Fingerprint}
            label="Biometric Login"
            checked={biometric}
            onChange={() => setBiometric(!biometric)} />

        </Card>

        {/* Support Section */}
        <Card className="p-0 overflow-hidden divide-y divide-gray-50">
          <MenuItem
            icon={AlertTriangle}
            label="Emergency Help"
            onClick={() => navigate('/emergency-help')} />

          <MenuItem
            icon={HelpCircle}
            label="Help & Support"
            onClick={() => navigate('/help-support')} />

          <MenuItem
            icon={Info}
            label="About App"
            onClick={() => navigate('/about')} />

        </Card>

        {/* Logout */}
        <Card className="p-0 overflow-hidden">
          <MenuItem
            icon={LogOut}
            label="Logout"
            onClick={() => setShowLogoutModal(true)}
            danger />

        </Card>

        <p className="text-center text-xs text-gray-400 pt-2 pb-4">
          Version 1.0.0 • TeleHealth+
        </p>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout"
        description="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        variant="danger" />

    </ScreenContainer>);

}