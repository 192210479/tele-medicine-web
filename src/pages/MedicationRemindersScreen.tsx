import { useState, useEffect, useRef, useCallback } from 'react';
import { Pill, Clock, Check, Plus, Trash2, RotateCcw, SkipForward } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { getSocket } from '../utils/socketUtils';

// ─── Types ────────────────────────────────────────────────
interface Reminder {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  status: 'Active' | 'Completed' | 'Skipped';
}

// ─── In-app toast ─────────────────────────────────────────
// A lightweight local toast — no extra library needed.
interface Toast {
  id: number;
  message: string;
  type: 'reminder' | 'success' | 'error';
}

export function MedicationRemindersScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  // Form state
  const [medicineName, setMedicineName] = useState('');
  const [time, setTime] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');

  // ── Helpers ──────────────────────────────────────────────
  const getUserId = () => localStorage.getItem('user_id');

  const showToast = useCallback((message: string, type: Toast['type'] = 'reminder') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  // ── Fetch from API ────────────────────────────────────────
  const fetchReminders = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const res = await fetch(`/api/reminders?user_id=${userId}`);
      if (res.ok) {
        const data: Reminder[] = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error('Failed to fetch reminders', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // ── Real-time Socket.IO listener ──────────────────────────
  // The backend emits "medication_reminder" to room "patient_{userId}"
  // exactly when the scheduled time arrives.
  useEffect(() => {
    const socket = getSocket();

    const handleReminder = (data: {
      reminder_id: number;
      medicine_name: string;
      dosage: string;
      frequency: string;
      reminder_time: string;
      message: string;
    }) => {
      // 1. Show in-app toast alert
      showToast(`💊 ${data.message}`, 'reminder');

      // 2. Browser push notification (works even on other tabs)
      if (Notification.permission === 'granted') {
        new Notification('💊 TeleHealth+ Medication Reminder', {
          body: data.message,
          icon: '/favicon.ico',
          tag: `reminder-${data.reminder_id}`,   // prevents duplicates
          requireInteraction: true,               // stays until dismissed
        });
      }

      // 3. Refresh the list so any status changes are reflected
      fetchReminders();
    };

    socket.on('medication_reminder', handleReminder);

    return () => {
      socket.off('medication_reminder', handleReminder);
    };
  }, [fetchReminders, showToast]);

  // ── Browser Notification permission request ───────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Local clock-based alarm (fallback / client-side) ─────
  // Fires at the exact HH:MM even if the socket is delayed.
  // Tracks fired reminders so it only fires once per minute per reminder.
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh  = String(now.getHours()).padStart(2, '0');
      const mm  = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;

      reminders
        .filter(r => r.status === 'Active' && r.reminder_time === currentTime)
        .forEach(r => {
          const key = `${r.id}-${currentTime}`;
          if (firedRef.current.has(key)) return;   // already fired this minute
          firedRef.current.add(key);

          const msg = `Time to take ${r.medicine_name}${r.dosage ? ` (${r.dosage})` : ''}`;

          // In-app toast
          showToast(`💊 ${msg}`, 'reminder');

          // Browser push notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💊 Medication Reminder', {
              body: msg,
              icon: '/favicon.ico',
              tag: `local-${r.id}-${currentTime}`,
              requireInteraction: true,
            });
          }
        });
    };

    const interval = setInterval(tick, 30_000);  // check every 30 s
    tick();   // also run immediately on mount / reminders change
    return () => clearInterval(interval);
  }, [reminders, showToast]);

  // ── Add reminder ──────────────────────────────────────────
  const handleAddReminder = async () => {
    if (!medicineName.trim() || !time) {
      showToast('Please fill in medicine name and time.', 'error');
      return;
    }
    const userId = getUserId();
    if (!userId) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/reminder/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          medicine_name: medicineName.trim(),
          dosage: dosage.trim(),
          frequency: frequency,
          reminder_time: time,       // "HH:MM" from <input type="time">
        }),
      });

      if (res.ok) {
        const newReminder: Reminder = await res.json();
        // Optimistically add to list — no need to refetch
        setReminders(prev => [...prev, newReminder].sort((a, b) =>
          a.reminder_time.localeCompare(b.reminder_time)
        ));
        setShowAddModal(false);
        setMedicineName('');
        setTime('');
        setDosage('');
        setFrequency('Once daily');
        showToast('Reminder added successfully!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add reminder.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Mark taken ────────────────────────────────────────────
  const handleMarkTaken = async (id: number) => {
    // Optimistic UI update
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'Completed' } : r
    ));
    try {
      const res = await fetch(`/api/reminder/complete/${id}`, { method: 'PUT' });
      if (!res.ok) {
        // Revert on failure
        setReminders(prev => prev.map(r =>
          r.id === id ? { ...r, status: 'Active' } : r
        ));
      }
    } catch {
      setReminders(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'Active' } : r
      ));
    }
  };

  // ── Skip for today ────────────────────────────────────────
  // Marks the reminder as Skipped locally so it disappears from
  // Today's Schedule. The backend status stays Active so it fires
  // again tomorrow — we use the reactivate endpoint to ensure
  // last_triggered is cleared (no double-fire guard blocks it).
  const handleSkip = async (id: number) => {
    // Optimistic: move out of active list immediately
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'Skipped' } : r
    ));
    showToast('Reminder skipped for today.', 'success');
    try {
      // Reactivate clears last_triggered so tomorrow it fires normally
      await fetch(`/api/reminder/reactivate/${id}`, { method: 'PUT' });
    } catch {
      // Revert silently on network failure
      setReminders(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'Active' } : r
      ));
    }
  };

  // ── Reactivate ────────────────────────────────────────────
  const handleReactivate = async (id: number) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'Active' } : r
    ));
    try {
      await fetch(`/api/reminder/reactivate/${id}`, { method: 'PUT' });
    } catch {
      setReminders(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'Completed' } : r
      ));
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    // Optimistic removal
    setReminders(prev => prev.filter(r => r.id !== id));
    try {
      const res = await fetch(`/api/reminder/delete/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        // Revert and refetch on failure
        fetchReminders();
      }
    } catch {
      fetchReminders();
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const activeReminders = reminders.filter(r => r.status === 'Active');
  const completedReminders = reminders.filter(r => r.status === 'Completed');
  const skippedReminders = reminders.filter(r => r.status === 'Skipped');

  const toastColors: Record<Toast['type'], string> = {
    reminder: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-500',
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <ScreenContainer
      title="Medication Reminders"
      showBack
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 text-primary hover:bg-blue-50 rounded-full"
        >
          <Plus size={24} />
        </button>
      }
    >
      {/* ── In-app Toast Stack ─────────────────────────── */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${toastColors[t.type]} text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-lg animate-in slide-in-from-top duration-300`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <div className="px-6 py-4 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium tracking-tight">Loading schedule...</p>
          </div>

        ) : reminders.length === 0 ? (
          <EmptyState
            title="No Reminders Set"
            description="Add your medications to get timely reminders."
            actionLabel="Add Reminder"
            onAction={() => setShowAddModal(true)}
            illustrationType="empty"
          />

        ) : (
          <div className="space-y-6">

            {/* ── Active reminders ──────────────────────── */}
            {activeReminders.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-4">
                  Today's Schedule
                </h3>
                <div className="space-y-4">
                  {activeReminders.map(reminder => (
                    <Card key={reminder.id} className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-primary">
                            <Pill size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-text-primary">
                              {reminder.medicine_name}
                            </h4>
                            <p className="text-sm text-text-secondary">
                              {reminder.dosage ? `${reminder.dosage} • ` : ''}
                              {reminder.frequency || 'Scheduled'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs font-medium text-text-secondary">
                            <Clock size={12} />
                            {reminder.reminder_time}
                          </div>
                          <button
                            onClick={() => handleDelete(reminder.id)}
                            className="p-1.5 text-gray-300 hover:text-red-400 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete reminder"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2 border-t border-gray-50">
                        <Button
                          className="flex-1 h-10 text-sm bg-green-500 hover:bg-green-600 text-white shadow-green-200"
                          onClick={() => handleMarkTaken(reminder.id)}
                        >
                          Mark Taken
                        </Button>
                        <Button
                          className="flex-1 h-10 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-none"
                          onClick={() => handleSkip(reminder.id)}
                        >
                          <SkipForward size={14} className="mr-1.5" />
                          Skip Today
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Completed reminders ───────────────────── */}
            {completedReminders.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Taken Today
                </h3>
                <div className="space-y-3">
                  {completedReminders.map(reminder => (
                    <Card key={reminder.id} className="flex flex-col gap-3 opacity-70">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-success">
                            <Pill size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-text-primary line-through">
                              {reminder.medicine_name}
                            </h4>
                            <p className="text-sm text-text-secondary">
                              {reminder.dosage ? `${reminder.dosage} • ` : ''}
                              {reminder.frequency || 'Scheduled'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs font-medium text-text-secondary">
                            <Clock size={12} />
                            {reminder.reminder_time}
                          </div>
                          <button
                            onClick={() => handleDelete(reminder.id)}
                            className="p-1.5 text-gray-300 hover:text-red-400 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete reminder"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <Badge variant="success" className="flex items-center gap-1">
                          <Check size={12} /> Taken
                        </Badge>
                        <button
                          onClick={() => handleReactivate(reminder.id)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                        >
                          <RotateCcw size={12} /> Undo
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Skipped reminders ─────────────────────── */}
            {skippedReminders.length > 0 && (
              <div>
                <h3 className="text-base font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Skipped Today
                </h3>
                <div className="space-y-3">
                  {skippedReminders.map(reminder => (
                    <Card key={reminder.id} className="flex flex-col gap-3 opacity-60">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400">
                            <Pill size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-400 line-through">
                              {reminder.medicine_name}
                            </h4>
                            <p className="text-sm text-text-secondary">
                              {reminder.dosage ? `${reminder.dosage} • ` : ''}
                              {reminder.frequency || 'Scheduled'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs font-medium text-text-secondary">
                            <Clock size={12} />
                            {reminder.reminder_time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <Badge variant="neutral" className="flex items-center gap-1 bg-gray-100 text-gray-500">
                          <SkipForward size={12} /> Skipped
                        </Badge>
                        <button
                          onClick={() => handleReactivate(reminder.id)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                        >
                          <RotateCcw size={12} /> Undo
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Add Reminder Modal ─────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setMedicineName('');
          setTime('');
          setDosage('');
          setFrequency('Once daily');
        }}
        title="Add Reminder"
        confirmText={isSaving ? 'Saving...' : 'Add Medicine'}
        onConfirm={handleAddReminder}
      >
        <div className="space-y-4">
          <Input
            label="Medicine Name"
            placeholder="e.g. Paracetamol"
            value={medicineName}
            onChange={(e: any) => setMedicineName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dosage"
              placeholder="500mg"
              value={dosage}
              onChange={(e: any) => setDosage(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary ml-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary ml-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary"
            >
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="Every morning">Every morning</option>
              <option value="Every night">Every night</option>
              <option value="As needed">As needed</option>
            </select>
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}