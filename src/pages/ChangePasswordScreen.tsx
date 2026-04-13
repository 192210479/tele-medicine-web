import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { PasswordInput } from '../components/ui/PasswordInput';
import { CheckCircle2, ShieldAlert, Save } from 'lucide-react';

export function ChangePasswordScreen() {
  const { userId: authUserId, role: authRole } = useAuth();
  const userId = authUserId ?? Number(localStorage.getItem("user_id"));
  const role   = authRole   ?? localStorage.getItem("role") ?? "";

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = () => {
    if (newPwd !== confirmPwd) return "Passwords do not match";
    if (newPwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(newPwd)) return "Must contain at least one uppercase letter";
    if (!/[0-9]/.test(newPwd)) return "Must contain at least one number";
    if (!/[!@#$%^&*]/.test(newPwd)) return "Must contain at least one special character (!@#$%^&*)";
    return null;
  };

  const handleUpdate = async () => {
    const vError = validate();
    if (vError) {
      setError(vError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/password/change", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:      userId,
          role:         role,
          old_password: currentPwd,
          new_password: newPwd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update password");
        return;
      }
      setSuccess("Password updated successfully");
      setCurrentPwd(""); 
      setNewPwd(""); 
      setConfirmPwd("");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer title="Change Password" showBack className="bg-gray-50 pb-8">
      <div className="p-6 max-w-xl mx-auto space-y-6">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">New Credentials</h2>
          <p className="text-text-secondary text-sm">Keep your account secure with a strong password</p>
        </header>

        <Card className="bg-white border-none shadow-soft p-8 space-y-6">
          <PasswordInput
            label="Current Password"
            value={currentPwd}
            onChange={setCurrentPwd}
            placeholder="Enter current password"
          />

          <div className="pt-2 border-t border-gray-50"></div>

          <PasswordInput
            label="New Password"
            value={newPwd}
            onChange={setNewPwd}
            placeholder="Min 8 chars, uppercase, digit, special"
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPwd}
            onChange={setConfirmPwd}
            placeholder="Repeat new password"
          />

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-in fade-in duration-300">
              <ShieldAlert size={18} className="flex-shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-600 rounded-xl border border-green-100 animate-in fade-in duration-300">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <p className="text-xs font-bold leading-tight">{success}</p>
            </div>
          )}

          <button
            onClick={handleUpdate}
            disabled={loading || !currentPwd || !newPwd || !confirmPwd}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-md active:scale-[0.98] ${
                loading ? 'bg-gray-200 text-gray-400' : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <Save size={20} />
                Update Password
              </>
            )}
          </button>
        </Card>

        {/* Security reminders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <p className="text-primary text-[10px] uppercase font-black tracking-widest mb-1">Strength Tip</p>
                <p className="text-blue-800 text-xs font-medium">Use a mix of letters, numbers & special characters for better protection.</p>
             </div>
             <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <p className="text-orange-500 text-[10px] uppercase font-black tracking-widest mb-1">Account Sync</p>
                <p className="text-orange-800 text-xs font-medium">Changing your password will sign you out from all other active devices.</p>
             </div>
        </div>
      </div>
    </ScreenContainer>
  );
}
