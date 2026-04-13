import { useState } from 'react';
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
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useProfile, useDisplayName } from '../context/ProfileContext';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, loading: isLoading } = useProfile();
  const displayName = useDisplayName();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    danger = false
  }: { icon: any; label: string; onClick?: () => void; danger?: boolean; }) =>
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
          <Icon size={18} />
        </div>
        <span className={`font-medium ${danger ? 'text-red-600' : 'text-text-primary'}`}>{label}</span>
      </div>
      <ChevronRight size={18} className="text-gray-400" />
    </button>;

  return (
    <ScreenContainer className="pb-8">
      {/* Unified Profile Header */}
      <div className="px-6 pt-6 pb-6 bg-white border-b border-gray-100">
        {isLoading ? (
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-gray-100 bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button
                onClick={() => navigate('/edit-profile')}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <Edit size={12} className="text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary">{displayName}</h1>
              <p className="text-sm text-text-secondary">{profile?.email || 'No email'}</p>
              <Badge variant="info" className="mt-1">
                {profile?.role === 'patient' ? '👤 Patient' : profile?.role === 'doctor' ? '🩺 Doctor' : '🛡️ Admin'}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pt-4 space-y-6">
        <Card className="p-0 overflow-hidden divide-y divide-gray-50">
          <MenuItem icon={User} label="Edit Profile" onClick={() => navigate('/edit-profile')} />
          <MenuItem icon={CreditCard} label="Payments & Billing" onClick={() => navigate('/payments-billing')} />
          <MenuItem icon={Bell} label="Notifications" onClick={() => navigate('/notifications')} />
          <MenuItem icon={Shield} label="Privacy & Security" onClick={() => navigate('/privacy-security')} />
        </Card>

        <Card className="p-0 overflow-hidden divide-y divide-gray-50">
          {profile?.role === 'patient' && (
            <MenuItem icon={AlertTriangle} label="Emergency Help" onClick={() => navigate('/emergency-help')} />
          )}
          <MenuItem icon={HelpCircle} label="Help & Support" onClick={() => navigate('/help-support')} />
          <MenuItem icon={Info} label="About App" onClick={() => navigate('/about')} />
        </Card>

        <Card className="p-0 overflow-hidden">
          <MenuItem icon={LogOut} label="Logout" onClick={() => setShowLogoutModal(true)} danger />
        </Card>

        <p className="text-center text-xs text-gray-400 pt-2 pb-4">Version 1.0.0 • TeleHealth+</p>
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
    </ScreenContainer>
  );
}
