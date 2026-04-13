import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../utils/socketUtils';

interface ScheduledAppt {
  id: number;
  time: string;
  date: string;
  name: string; // patient_name for doctor, doctor_name for patient
}

const LocalNotificationContext = createContext({});

export function LocalNotificationProvider({ children }: { children: React.ReactNode }) {
  const { userId, role } = useAuth();
  const scheduledRef = useRef<Set<string>>(new Set());

  const scheduleNotification = useCallback((appt: ScheduledAppt, type: '5min' | 'now') => {
    const key = `${appt.id}-${type}`;
    if (scheduledRef.current.has(key)) return;
    
    const [h, m] = appt.time.split(':').map(Number);
    const [y, mon, d] = appt.date.split('-').map(Number);
    const targetDate = new Date(y, mon - 1, d, h, m, 0, 0);
    
    if (type === '5min') {
      targetDate.setMinutes(targetDate.getMinutes() - 5);
    }
    
    const delay = targetDate.getTime() - Date.now();
    
    if (delay > 0) {
      scheduledRef.current.add(key);
      setTimeout(() => {
        const title = type === '5min' ? 'Upcoming Appointment' : 'Appointment Starting Now';
        const description = type === '5min' 
          ? `Your appointment with ${appt.name} starts in 5 minutes.`
          : `Your appointment with ${appt.name} is starting now. Join the consultation.`;
        
        const notification = {
          id: Date.now(),
          type: 'appointment',
          title,
          description,
          is_read: false,
          created_at: new Date().toISOString(),
          local: true // Flag to distinguish
        };

        // 1. Save to local storage so it persists and can be seen in Notification Center
        const stored = JSON.parse(localStorage.getItem('local_notifications') || '[]');
        localStorage.setItem('local_notifications', JSON.stringify([notification, ...stored]));

        // 2. Dispatch event for real-time UI update
        window.dispatchEvent(new CustomEvent('new_notification_local', { detail: notification }));
        
        // 3. Optional: Trigger socket-like event if components are listening specifically to socket
        // NotificationCenterScreen listens for 'new_notification' on socket.
        // We can't easily trigger the socket instance from here to fire listeners, 
        // but we can dispatch a globally available event.
      }, delay);
    }
  }, []);

  const fetchAndSchedule = useCallback(async () => {
    if (!userId || !role) return;
    
    try {
      const endpoint = role === 'doctor' 
        ? `/api/my-appointments?user_id=${userId}&role=doctor&status=Scheduled`
        : `/api/my-appointments?user_id=${userId}&role=patient&status=Scheduled`;
        
      const res = await fetch(endpoint);
      if (!res.ok) return;
      const data = await res.json();
      const appointments = Array.isArray(data) ? data : [];
      
      const today = new Date().toISOString().split('T')[0];
      
      appointments.forEach((appt: any) => {
        // Only schedule for today's appointments
        if (appt.date === today) {
          const scheduled: ScheduledAppt = {
            id: appt.id,
            time: appt.time,
            date: appt.date,
            name: role === 'doctor' ? appt.patient_name : appt.doctor_name
          };
          
          scheduleNotification(scheduled, '5min');
          scheduleNotification(scheduled, 'now');
        }
      });
    } catch (e) {
      console.error("Failed to fetch appointments for scheduling:", e);
    }
  }, [userId, role, scheduleNotification]);

  useEffect(() => {
    // Initial fetch
    fetchAndSchedule();
    
    // Refresh schedule every 15 minutes to catch new bookings
    const interval = setInterval(fetchAndSchedule, 15 * 60 * 1000);
    
    // Also listen for a local event if appointment is booked
    window.addEventListener('appointment-booked', fetchAndSchedule);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('appointment-booked', fetchAndSchedule);
    };
  }, [fetchAndSchedule]);

  return (
    <LocalNotificationContext.Provider value={{}}>
      {children}
    </LocalNotificationContext.Provider>
  );
}

export const useLocalNotificationScheduler = () => useContext(LocalNotificationContext);
