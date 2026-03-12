import { useState, useEffect } from 'react';
import { Smartphone, Laptop, Tablet, Trash2 } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export function DeviceManagementScreen() {
  const { userId, role } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId && role) {
      fetchDevices();
    }
  }, [userId, role]);

  const fetchDevices = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/devices?user_id=${userId}&role=${role}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setDevices(data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!window.confirm("Are you sure you want to remove this device?")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/device/delete/${deviceId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("Device removed successfully");
        fetchDevices();
      } else {
        alert("Failed to remove device");
      }
    } catch (error) {
      console.error('Delete device failed:', error);
    }
  };

  const getIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('laptop') || lowerName.includes('macbook') || lowerName.includes('windows')) {
      return <Laptop size={20} />;
    }
    if (lowerName.includes('tablet') || lowerName.includes('ipad')) {
      return <Tablet size={20} />;
    }
    return <Smartphone size={20} />;
  };

  return (
    <ScreenContainer title="Device Management" showBack>
      <div className="px-6 py-6 space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 italic">Loading devices...</div>
        ) : devices.length > 0 ? (
          devices.map((device) => (
            <Card key={device.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                  {getIcon(device.device_name)}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">{device.device_name}</h4>
                  <p className="text-xs text-text-secondary">
                    {device.ip_address} • {device.last_login}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteDevice(device.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 italic">No devices managed.</div>
        )}

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-6">
          <h4 className="font-bold text-primary text-sm mb-1">Security Tip</h4>
          <p className="text-xs text-blue-800">
            If you don't recognize a device, remove it immediately and change
            your password to secure your account.
          </p>
        </div>
      </div>
    </ScreenContainer>
  );
}