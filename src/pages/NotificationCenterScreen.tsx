import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  Calendar,
  FileText,
  MessageSquare,
  Pill,
  Star,
  ShieldAlert,
  UserPlus,
  Stethoscope,
  FolderOpen,
  Check,
} from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socketUtils';

// ─── Types ────────────────────────────────────────────────
interface ApiNotification {
  id: number;
  type: string;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: any;
  color: string;
}

// ─── Helpers ──────────────────────────────────────────────
function mapTypeToIcon(type: string) {
  const t = (type ?? '').toLowerCase();
  if (t === 'reminder') return Pill;
  if (t === 'appointment') return Calendar;
  if (t === 'prescription') return FileText;
  if (t === 'chat') return MessageSquare;
  if (t === 'review' || t === 'rating') return Star;
  if (t === 'emergency') return ShieldAlert;
  if (t === 'registration') return UserPlus;
  if (t === 'consultation') return Stethoscope;
  if (t === 'medical record' || t === 'recordrequest') return FolderOpen;
  return Bell;
}

function mapTypeToColor(type: string) {
  const t = (type ?? '').toLowerCase();
  if (t === 'reminder') return 'text-blue-500 bg-blue-50';
  if (t === 'appointment') return 'text-blue-500 bg-blue-50';
  if (t === 'prescription') return 'text-green-500 bg-green-50';
  if (t === 'chat') return 'text-teal-500 bg-teal-50';
  if (t === 'review' || t === 'rating') return 'text-yellow-500 bg-yellow-50';
  if (t === 'emergency') return 'text-red-500 bg-red-50';
  if (t === 'registration') return 'text-purple-500 bg-purple-50';
  if (t === 'consultation') return 'text-indigo-500 bg-indigo-50';
  if (t === 'medical record' || t === 'recordrequest') return 'text-orange-500 bg-orange-50';
  return 'text-gray-500 bg-gray-100';
}

function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  // Ensure we parse as UTC if no timezone is provided to avoid the '5h ago' local vs UTC mismatch
  const normalized = iso.includes('Z') || iso.includes('+') ? iso : (iso.includes('T') ? iso + 'Z' : iso.replace(' ', 'T') + 'Z');
  const diff = Date.now() - new Date(normalized).getTime();
  const absDiff = Math.abs(diff); // Handle slight clock skews
  
  const mins = Math.floor(absDiff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function toUiNotif(n: ApiNotification): Notification {
  return {
    id: n.id,
    type: (n.type ?? '').toLowerCase(),
    title: n.title,
    desc: n.description,
    time: formatRelativeTime(n.created_at),
    unread: !n.is_read,
    icon: mapTypeToIcon(n.type),
    color: mapTypeToColor(n.type),
  };
}

// ─── Component ────────────────────────────────────────────
export function NotificationCenterScreen() {
  const { userId, role } = useAuth();

  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // ── Fetch all notifications ───────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId || !role) return;
    try {
      const res = await fetch(`/api/notifications?user_id=${userId}&role=${role}`);
      if (!res.ok) return;
      const data = await res.json();
      const list: ApiNotification[] = Array.isArray(data)
        ? data
        : (data.notifications ?? []);

      const uiList = list.map(toUiNotif);

      // Merge with local ones
      const localData = JSON.parse(localStorage.getItem('local_notifications') || '[]');
      const localUi = localData.map((n: any) => ({
        id: n.id,
        type: 'appointment',
        title: n.title,
        desc: n.description,
        time: formatRelativeTime(n.created_at),
        unread: !n.is_read,
        icon: mapTypeToIcon('appointment'),
        color: mapTypeToColor('appointment'),
      }));

      if (isMounted.current) {
        setNotifications([...localUi, ...uiList].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
      }
    } catch { /* silent */ } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    isMounted.current = true;
    fetchNotifications();
    return () => { isMounted.current = false; };
  }, [fetchNotifications]);

  // ── Real-time: new_notification + medication_reminder ─────
  useEffect(() => {
    const socket = getSocket();

    const handleNew = (data: any) => {
      const notif: Notification = {
        id: data.id ?? Date.now(),
        type: (data.type ?? '').toLowerCase(),
        title: data.title ?? 'New notification',
        desc: data.description ?? '',
        time: 'Just now',
        unread: true,
        icon: mapTypeToIcon(data.type),
        color: mapTypeToColor(data.type),
      };
      setNotifications(prev => [notif, ...prev]);
    };

    const handleReminder = (data: any) => {
      const notif: Notification = {
        id: Date.now(),
        type: 'reminder',
        title: '💊 Medication Reminder',
        desc: data.message ?? `Time to take ${data.medicine_name}`,
        time: 'Just now',
        unread: true,
        icon: Pill,
        color: 'text-blue-500 bg-blue-50',
      };
      setNotifications(prev => [notif, ...prev]);
    };

    const handleLocal = (e: any) => {
      const n = e.detail;
      const uiNotif: Notification = {
        id: n.id,
        type: 'appointment',
        title: n.title,
        desc: n.description,
        time: 'Just now',
        unread: true,
        icon: mapTypeToIcon('appointment'),
        color: mapTypeToColor('appointment'),
      };
      setNotifications(prev => [uiNotif, ...prev]);
    };

    socket.on('new_notification', handleNew);
    socket.on('medication_reminder', handleReminder);
    window.addEventListener('new_notification_local', handleLocal as EventListener);

    return () => {
      socket.off('new_notification', handleNew);
      socket.off('medication_reminder', handleReminder);
      window.removeEventListener('new_notification_local', handleLocal as EventListener);
    };
  }, []);

  // ── Mark one as read ──────────────────────────────────────
  const markAsRead = async (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
    // Also update local storage if it's a local one
    const local = JSON.parse(localStorage.getItem('local_notifications') || '[]');
    const updated = local.map((n: any) => n.id === id ? { ...n, is_read: true } : n);
    localStorage.setItem('local_notifications', JSON.stringify(updated));

    try {
      await fetch(`/api/notification/read/${id}`, { method: 'PUT' });
    } catch { /* silent — UI already updated */ }
  };

  // ── Mark all as read ──────────────────────────────────────
  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    localStorage.setItem('local_notifications', JSON.stringify(
      JSON.parse(localStorage.getItem('local_notifications') || '[]').map((n: any) => ({ ...n, is_read: true }))
    ));

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      });
    } catch { /* silent */ }
  };

  // ── Filter tabs — role-aware ──────────────────────────────
  const filtersByRole: Record<string, string[]> = {
    patient: ['All', 'Appointments', 'Prescriptions', 'Reminders', 'Consultations'],
    doctor: ['All', 'Appointments', 'Medical Records', 'Registrations'],
    admin: ['All', 'Registrations', 'Emergencies'],
  };
  const filters = filtersByRole[role ?? 'patient'] ?? filtersByRole['patient'];

  const filterTypeMap: Record<string, string> = {
    'Appointments': 'appointment',
    'Prescriptions': 'prescription',
    'Messages': 'chat',
    'Reminders': 'reminder',
    'Consultations': 'consultation',
    'Reviews': 'review',
    'Rating': 'rating',
    'Medical Records': 'medical record',
    'Registrations': 'registration',
    'Emergencies': 'emergency',
  };

  const filteredNotifications = activeFilter === 'All'
    ? notifications
    : notifications.filter(n => n.type === (filterTypeMap[activeFilter] ?? activeFilter.toLowerCase()));

  return (
    <ScreenContainer
      title="Notifications"
      showBack
      actions={
        <button
          onClick={markAllRead}
          className="text-sm font-medium text-primary"
        >
          Mark all read
        </button>
      }
    >
      <div className="flex flex-col h-full">
        <div className="px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === filter
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-3 mt-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <Card
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${notification.unread ? 'bg-blue-50/30' : 'bg-white'
                    }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.color}`}
                  >
                    <notification.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4
                        className={`text-sm ${notification.unread
                          ? 'font-bold text-text-primary'
                          : 'font-medium text-text-primary'
                          }`}
                      >
                        {notification.title}
                      </h4>
                      <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 truncate">
                      {notification.desc}
                    </p>
                  </div>
                  {notification.unread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  )}
                </Card>
              ))
            ) : (
              <EmptyState
                title="No Notifications"
                description="You're all caught up! No new notifications."
                illustrationType="empty"
              />
            )}
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
}