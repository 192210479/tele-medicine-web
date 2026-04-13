import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { LogOut, ShieldAlert, History } from 'lucide-react';

type ActivityLog = {
  device: string;
  location: string;
  date: string;   // raw datetime string
};

export function LoginActivityScreen() {
  const navigate = useNavigate();
  const { userId: authUserId, role: authRole, logout: authLogout } = useAuth();
  const userId = authUserId ?? Number(localStorage.getItem("user_id"));
  const role = authRole ?? localStorage.getItem("role") ?? "";

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!userId || !role) return;
      try {
        const res = await fetch(`/api/login-activity?user_id=${userId}&role=${role}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch login activity", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [userId, role]);

  const fmtRelative = (raw: string): string => {
    const then = new Date(raw);
    const diffMs = Date.now() - then.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Active Now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} hour${diffH > 1 ? "s" : ""} ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Yesterday";
    if (diffD < 7) return `${diffD} days ago`;
    return then.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Log out from all other active devices?")) return;
    try {
      const res = await fetch("/api/devices/logout-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role })
      });
      if (res.ok) {
        authLogout();
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout all fail", err);
    }
  };

  return (
    <ScreenContainer title="Login Activity" showBack className="bg-gray-50 pb-8">
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        <header className="bg-white p-6 rounded-3xl shadow-soft flex items-center gap-5 border border-gray-100">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <History size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Where you're logged in</h2>
            <p className="text-text-secondary text-sm">Review your session history across all devices</p>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary font-medium">Crunching sessions...</p>
          </div>
        ) : logs.length === 0 ? (
          <Card className="text-center py-24 bg-white border-none shadow-soft">
            <ShieldAlert size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-text-secondary font-bold">No login activity found.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <Card key={index} className="bg-white rounded-2xl border-none shadow-soft p-5 flex items-center gap-5 transition-shadow hover:shadow-md">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-inner grayscale-[0.5] group-hover:grayscale-0 transition-all">
                  📱
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-text-primary text-base">{log.device}</p>
                    {index === 0 && (
                      <span className="bg-green-100/80 text-green-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-green-200 shadow-sm">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                    <p className="text-text-secondary text-xs flex items-center gap-1.5 font-medium">
                      <span className="opacity-60">📍</span> {log.location || "System Access"}
                    </p>
                    <p className="text-text-secondary text-xs flex items-center gap-1.5 font-medium">
                      <span className="opacity-60">🕐</span> {fmtRelative(log.date)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <footer className="pt-6">
          <button
            onClick={handleLogoutAll}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white border-2 border-dashed border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all hover:border-red-500 active:scale-[0.98]"
          >
            <LogOut size={20} />
            Sign Out from All Devices
          </button>
          <p className="text-center text-gray-400 text-xs mt-6 px-8 leading-relaxed">
            This will disconnect your account from all other browser sessions and active device tokens immediately.
          </p>
        </footer>

      </div>
    </ScreenContainer>
  );
}
