import React, { useState } from 'react';
import { Bell, Calendar, Pill, AlertCircle } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
export function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({
    appointments: true,
    prescriptions: true,
    system: false,
    offers: true
  });
  const Toggle = ({
    checked,
    onChange



  }: {checked: boolean;onChange: () => void;}) =>
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-gray-300'}`}>

      <div
      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'left-7' : 'left-1'}`} />

    </button>;

  const SettingItem = ({
    icon: Icon,
    label,
    description,
    checked,
    onChange
  }: any) =>
  <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-none">
      <div className="flex items-start gap-3 pr-4">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary mt-1">
          <Icon size={16} />
        </div>
        <div>
          <h4 className="font-medium text-text-primary">{label}</h4>
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>;

  return (
    <ScreenContainer title="Notifications" showBack>
      <div className="px-6 py-4">
        <div className="bg-white rounded-2xl shadow-soft px-4 mb-6">
          <SettingItem
            icon={Calendar}
            label="Appointment Reminders"
            description="Get notified about upcoming appointments"
            checked={settings.appointments}
            onChange={() =>
            setSettings((s) => ({
              ...s,
              appointments: !s.appointments
            }))
            } />

          <SettingItem
            icon={Pill}
            label="Prescription Updates"
            description="Notifications for new prescriptions"
            checked={settings.prescriptions}
            onChange={() =>
            setSettings((s) => ({
              ...s,
              prescriptions: !s.prescriptions
            }))
            } />

          <SettingItem
            icon={AlertCircle}
            label="System Alerts"
            description="Security alerts and app updates"
            checked={settings.system}
            onChange={() =>
            setSettings((s) => ({
              ...s,
              system: !s.system
            }))
            } />

          <SettingItem
            icon={Bell}
            label="Offers & Tips"
            description="Health tips and promotional offers"
            checked={settings.offers}
            onChange={() =>
            setSettings((s) => ({
              ...s,
              offers: !s.offers
            }))
            } />

        </div>

        <Button fullWidth>Save Preferences</Button>
      </div>
    </ScreenContainer>);

}