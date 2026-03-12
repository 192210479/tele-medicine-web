import { useState, useEffect } from 'react';
import { Pill, Clock, Check, Plus } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { apiGet, apiPost, apiPut } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function MedicationRemindersScreen() {
  const { userId } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [medicineName, setMedicineName] = useState('');
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (userId) {
      loadReminders();
    }
  }, [userId]);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/reminders', { user_id: userId });
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!medicineName) {
      alert('Please enter a medicine name');
      return;
    }

    try {
      setIsLoading(true);
      await apiPost('/api/reminder/add', {
        user_id: userId,
        medicine_name: medicineName,
        reminder_time: time,
        status: 'Active'
      });

      setShowAddModal(false);
      setMedicineName('');
      loadReminders();
    } catch (error) {
      alert('Failed to add reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (reminderId: number) => {
    try {
      await apiPut(`/api/reminder/complete/${reminderId}`, {
        user_id: userId,
        role: 'patient'
      });
      loadReminders();
    } catch (error) {
      alert('Failed to update reminder');
    }
  };

  const sortedReminders = [...(reminders || [])].sort((a, b) => {
    const aComp = a.status === 'Completed';
    const bComp = b.status === 'Completed';
    if (aComp && !bComp) return 1;
    if (!aComp && bComp) return -1;
    return a.reminder_time?.localeCompare(b.reminder_time) || 0;
  });

  return (
    <ScreenContainer
      title="Medication Reminders"
      showBack
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 text-primary hover:bg-blue-50 rounded-full transition-colors"
        >
          <Plus size={24} />
        </button>
      }
    >
      <div className="px-6 py-4 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sortedReminders.length > 0 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="text-primary" size={20} />
                Today's Schedule
              </h3>
              <div className="space-y-4">
                {sortedReminders.map((reminder) => {
                  const isCompleted = reminder.status === 'Completed';
                  
                  return (
                    <Card 
                      key={reminder.id} 
                      className={`flex flex-col gap-4 transition-all ${
                        isCompleted ? 'opacity-70 bg-gray-50' : 'border-blue-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                              isCompleted ? 'bg-green-100 text-success' : 'bg-blue-50 text-primary'
                            }`}
                          >
                            <Pill size={24} />
                          </div>
                          <div>
                            <h4 className={`font-bold transition-colors ${isCompleted ? 'text-gray-500' : 'text-text-primary'}`}>
                              {reminder.medicine_name}
                            </h4>
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-0.5">
                              Daily Prescription
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                             isCompleted ? 'bg-green-50 text-success' : 'bg-blue-50 text-primary'
                        }`}>
                          <Clock size={12} />
                          {reminder.reminder_time}
                        </div>
                      </div>

                      {!isCompleted && (
                        <div className="flex gap-3 pt-3 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            className="flex-1 h-10 text-xs font-bold border-gray-200 hover:bg-gray-100 text-gray-500 rounded-xl"
                            onClick={() => alert('Skipped')}
                          >
                            Skip
                          </Button>
                          <Button 
                            className="flex-1 h-10 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-100"
                            onClick={() => handleComplete(reminder.id)}
                          >
                            Mark Taken
                          </Button>
                        </div>
                      )}
                      
                      {isCompleted && (
                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          <Badge variant="success" className="flex items-center gap-1 py-1 px-3 rounded-full">
                            <Check size={12} /> COMPLETED
                          </Badge>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No reminders added."
            description="Add your daily medications to stay on track with your health journey."
            actionLabel="Add Reminder"
            onAction={() => setShowAddModal(true)}
            illustrationType="empty"
          />
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Medication Reminder"
        confirmText="Add Reminder"
        onConfirm={handleAddReminder}
      >
        <div className="space-y-6 py-4">
          <Input 
            label="Medicine Name" 
            placeholder="e.g. Vitamin C" 
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
          />
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-text-secondary ml-1">
              Reminder Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary font-bold text-lg"
            />
          </div>
        </div>
      </Modal>
    </ScreenContainer>
  );
}