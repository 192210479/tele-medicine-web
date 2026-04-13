import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  History,
  User,
  FileText,
  Activity,
  Bell,
  CheckSquare,
  AlertTriangle,
  LogOut,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDisplayName } from '../../context/ProfileContext';
export function Sidebar({ onClose }: { onClose?: () => void; }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, logout } = useAuth();
  const displayName = useDisplayName();

  if (!role && !localStorage.getItem("role")) return null;

  const displayRole = role
    ?? localStorage.getItem("role")
    ?? "Patient";

  const initial = displayName?.[0]?.toUpperCase() ?? "U";
  const patientLinks = [
    {
      path: '/patient-dashboard',
      icon: Home,
      label: 'Home'
    },
    {
      path: '/book-appointment',
      icon: Calendar,
      label: 'Book Appointment'
    },
    {
      path: '/upcoming-appointments',
      icon: Clock,
      label: 'Upcoming'
    },
    {
      path: '/history',
      icon: History,
      label: 'History'
    },
    {
      path: '/medical-records',
      icon: FileText,
      label: 'Medical Records'
    },
    {
      path: '/medication-reminders',
      icon: Bell,
      label: 'Reminders'
    },
    {
      path: '/emergency-help',
      icon: AlertTriangle,
      label: 'Emergency Help'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    }];

  const doctorLinks = [
    {
      path: '/doctor-dashboard',
      icon: Home,
      label: 'Home'
    },
    {
      path: '/doctor-appointments',
      icon: Calendar,
      label: 'Appointments'
    },
    {
      path: '/doctor-slot-availability',
      icon: Clock,
      label: 'Slot Availability'
    },
    {
      path: '/doctor-review-reports',
      icon: FileText,
      label: 'Review Reports'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    }];

  const adminLinks = [
    {
      path: '/admin-dashboard',
      icon: Home,
      label: 'Dashboard'
    },
    {
      path: '/admin-appointments',
      icon: Calendar,
      label: 'Appointments'
    },
    {
      path: '/doctor-approvals',
      icon: CheckSquare,
      label: 'Doctor Approvals'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    }];

  const links =
    role === 'patient' ?
      patientLinks :
      role === 'doctor' ?
        doctorLinks :
        adminLinks;
  const isActive = (path: string) => location.pathname === path;
  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };
  return (
    <div className="flex flex-col h-full w-[260px] bg-white border-r border-gray-100">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">TeleHealth+</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) =>
          <button
            key={link.path}
            onClick={() => handleNavigate(link.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(link.path) ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>

            <link.icon size={20} />
            <span>{link.label}</span>
          </button>
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {initial}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{displayRole}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">

          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>);

}
