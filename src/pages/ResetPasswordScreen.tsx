import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';
import { authApi } from '../services/authApi';

export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const email = localStorage.getItem('resetEmail');

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const validatePassword = (pwd: string) => {
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return hasUpper && hasLower && hasNum && hasSpecial;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (!validatePassword(password)) {
      setErrorMsg('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await authApi.resetPassword(email, password);
      // Clean up local storage
      localStorage.removeItem('resetEmail');
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-soft text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Password Reset
          </h2>
          <p className="text-text-secondary mb-8">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Button fullWidth onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-soft">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            Create New Password
          </h1>
        </div>

        <div className="space-y-6">
          <p className="text-text-secondary">
            Your new password must be different from previous used passwords.
          </p>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-6">
            <PasswordInput
              label="New Password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />
            
            <PasswordInput
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          
            <Button type="submit" fullWidth isLoading={isLoading}>
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
