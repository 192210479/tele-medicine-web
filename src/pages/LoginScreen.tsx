import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  User,
  Stethoscope,
  Shield,
  Fingerprint
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MedicalIllustration } from '../components/illustrations/MedicalIllustration';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { apiPost, apiGet } from '../utils/api';
import { saveAuth } from '../utils/auth';
import { joinSocketRoom } from '../utils/socketUtils';
import { PasswordInput } from '../components/ui/PasswordInput';

export function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { fetchProfile } = useProfile();
  const [role, setRole] = useState<string>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError('Please accept the Terms & Privacy Policy');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const data: any = await apiPost('/api/login', { email: trimmedEmail, password });

      const roleToUse = data.role;

      // Strict Role Check - DON'T PROCEED IF ROLE MISMATCH
      if (roleToUse !== role) {
        setError(`This is not the account with these credentials to login. Please login through the ${roleToUse.charAt(0).toUpperCase() + roleToUse.slice(1)} module.`);
        setIsLoading(false);
        return;
      }

      saveAuth({ user_id: data.user_id, role: roleToUse });

      // Fetch profile to get name/email for AuthContext
      const profileData = await apiGet<any>('/api/profile', { user_id: data.user_id, role: roleToUse }).catch(() => ({}));

      login({
        user_id: data.user_id,
        role: roleToUse as any,
        name: profileData.full_name || profileData.name || email,
        email: profileData.email || email,
      });

      // Populate ProfileContext
      await fetchProfile();

      // Socket Join
      joinSocketRoom();

      setIsLoading(false);

      if (roleToUse === 'patient') navigate('/home');
      else if (roleToUse === 'doctor') navigate('/doctor/dashboard');
      else if (roleToUse === 'admin') navigate('/admin/dashboard');

    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { id: 'patient', label: 'Patient', icon: <User size={18} /> },
    { id: 'doctor', label: 'Doctor', icon: <Stethoscope size={18} /> },
    { id: 'admin', label: 'Admin', icon: <Shield size={18} /> }
  ];

  return (
    <div className="min-h-screen w-full bg-white flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-blue-700 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <MedicalIllustration type="login" className="w-64 h-64 mb-8" />
          <h1 className="text-4xl font-bold mb-4">TeleHealth+</h1>
          <p className="text-xl text-blue-100">
            Your complete remote healthcare solution. Connect with top doctors
            anytime, anywhere.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-surface">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-soft">
          <div className="w-full mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Welcome Back
            </h2>
            <p className="text-text-secondary">
              Sign in to access your health dashboard
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            {roleOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setRole(option.id);
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  role === option.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                icon={<Mail size={18} />}
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(val) => {
                  setPassword(val);
                  setError('');
                }}
              />

            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary-dark">
                Forgot password?
              </Link>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-xs text-text-secondary leading-normal">
                  I accept the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="py-4 text-base shadow-lg shadow-primary/20">
              Sign In
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-text-secondary">Don't have an account?</span>
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate('/register')}
              className="py-4 text-base border-gray-200">
              Create New Account
            </Button>
          </form>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-sm text-text-secondary">
            Secure Login Powered by <span className="font-bold text-text-primary">MedicalTrust™</span>
          </p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
              Terms & Conditions
            </Link>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <Link to="/privacy" className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
