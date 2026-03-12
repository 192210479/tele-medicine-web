import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, MapPin, Clock, LogOut } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

export function LoginActivityScreen() {
  const navigate = useNavigate();
  const { userId, role, logout } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId && role) {
      fetchLoginActivity();
    }
  }, [userId, role]);

  const fetchLoginActivity = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/login-activity?user_id=${userId}&role=${role}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch login activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Are you sure you want to log out from all devices?")) return;
    
    try {
      const response = await fetch("http://localhost:5000/api/devices/logout-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: role })
      });

      if (response.ok) {
        alert("Logged out from all devices successfully");
        logout();
        navigate('/login');
      } else {
        alert("Failed to logout from all devices");
      }
    } catch (error) {
      console.error('Logout all failed:', error);
    }
  };

  return (
    <ScreenContainer title="Login Activity" showBack>
      <div className="px-6 py-6 space-y-4">
        <p className="text-sm text-text-secondary">
          These are the devices that have logged into your account recently.
        </p>

        {isLoading ? (
          <div className="text-center py-10 text-gray-400 italic">Loading activity...</div>
        ) : sessions.length > 0 ? (
          sessions.map((session, index) => (
            <Card key={index} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                <Smartphone size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-text-primary">
                    {session.device}
                  </h4>
                  {index === 0 && <Badge variant="success">Current</Badge>}
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                  <MapPin size={12} />
                  {session.location}
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                  <Clock size={12} />
                  {session.date}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 italic">No login activity found.</div>
        )}

        <div className="pt-4">
          <Button
            variant="outline"
            fullWidth
            onClick={handleLogoutAll}
            className="text-red-500 border-red-200 hover:bg-red-50"
            icon={<LogOut size={18} />}>
            Log Out of All Devices
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}