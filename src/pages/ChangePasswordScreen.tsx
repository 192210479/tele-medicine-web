import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export function ChangePasswordScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { userId, role } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/password/change", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          role: role,
          old_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Password updated successfully");
        navigate('/privacy-security');
      } else {
        alert(data.error || "Failed to update password");
      }
    } catch (e) {
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <ScreenContainer title="Change Password" showBack>
      <div className="px-6 py-6">
        <p className="text-text-secondary mb-6 text-sm">
          Your new password must be different from previously used passwords.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            icon={<Lock size={18} />} />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Lock size={18} />} />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={18} />} />


          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={isLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </ScreenContainer>);

}