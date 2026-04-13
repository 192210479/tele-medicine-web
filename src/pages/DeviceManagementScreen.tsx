import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Monitor, Smartphone, Trash2, ShieldCheck, HelpCircle } from 'lucide-react';

type DeviceItem = {
  id:          number;
  device_name: string;
  ip_address:  string;
  last_login:  string;
};

export function DeviceManagementScreen() {
  const { userId: authUserId, role: authRole } = useAuth();
  const userId = authUserId ?? Number(localStorage.getItem("user_id"));
  const role   = authRole   ?? localStorage.getItem("role") ?? "";

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    if (!userId || !role) return;
    try {
      const res = await fetch(`/api/devices?user_id=${userId}&role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (err) {
      console.error("Failed to fetch devices", err);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRemove = async (deviceId: number) => {
    if (!window.confirm("Remove this device from your account? This will log out of that device immediately.")) return;
    try {
      const res = await fetch(`/api/device/delete/${deviceId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
      }
    } catch (err) {
        console.error("Delete device fail", err);
    }
  };

  const fmtDate = (raw: string): string => {
    const d = new Date(raw);
    return d.toLocaleDateString("en-US", {
      month: "short", day: "2-digit", year: "numeric"
    });
  };

  return (
    <ScreenContainer title="Device Management" showBack className="bg-gray-50 pb-8">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Authenticated Devices</h2>
          <p className="text-text-secondary text-sm">Devices which have recently accessed your TeleHealth+ profile</p>
        </header>

        {loading ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-text-secondary font-medium">Scanning network access...</p>
             </div>
        ) : devices.length === 0 ? (
          <Card className="text-center py-20 bg-white border-none shadow-soft">
            <HelpCircle size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-text-secondary font-bold">No active devices found.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {devices.map(device => (
              <Card key={device.id} className="bg-white rounded-2xl border-none shadow-soft p-5 flex items-center gap-5 translate-all hover:shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-blue-50/50 flex items-center justify-center text-blue-600 shadow-inner group">
                   {device.device_name.toLowerCase().includes('desktop') || device.device_name.toLowerCase().includes('laptop') || device.device_name.toLowerCase().includes('mac') || device.device_name.toLowerCase().includes('win') ? (
                       <Monitor size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                   ) : (
                       <Smartphone size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                   )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-text-primary text-base">{device.device_name}</p>
                  <p className="text-text-secondary text-xs font-bold leading-none">
                    {device.ip_address} <span className="text-gray-200 mx-2">|</span> {fmtDate(device.last_login)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(device.id)}
                  className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.95] group"
                >
                  <Trash2 size={18} />
                </button>
              </Card>
            ))}
          </div>
        )}

        <footer className="pt-6">
          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex items-start gap-5">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
               <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-primary font-black text-xs uppercase tracking-[0.1em] mb-1">Security Recommendation</p>
              <p className="text-text-primary text-sm font-bold leading-relaxed">
                If you don't recognize a device listed here, remove it immediately and secure your account by changing your login password.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </ScreenContainer>
  );
}
