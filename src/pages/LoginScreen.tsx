import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Stethoscope,
  Shield,
  Fingerprint } from
'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MedicalIllustration } from '../components/illustrations/MedicalIllustration';
import { useAuth, UserRole } from '../context/AuthContext';
export function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('Please accept the Terms & Privacy Policy');
      return;
    }
    setIsLoading(true);
    try {
      const response = await login(role, email, password);
      const userRole = response.role;
      if (userRole === 'patient') navigate('/patient-dashboard');
      else if (userRole === 'doctor') navigate('/doctor-dashboard');
      else if (userRole === 'admin') navigate('/admin-dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  const roleOptions = [
  {
    id: 'patient',
    label: 'Patient',
    icon: <User size={18} />
  },
  {
    id: 'doctor',
    label: 'Doctor',
    icon: <Stethoscope size={18} />
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <Shield size={18} />
  }];

  return (
    <div className="min-h-screen w-full bg-white flex">
      {/* Left side - Branding (Hidden on mobile) */}
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

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                icon={<Mail size={18} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />

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
                to="/reset-password"
                className="text-sm font-medium text-primary hover:text-primary-dark">

                Forgot Password?
              </Link>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-text-secondary ml-1">
                I am a:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((option) =>
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRole(option.id as UserRole)}
                  className={`
                      flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                      ${role === option.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}
                    `}>

                    {option.icon}
                    <span className="text-xs font-medium mt-1">
                      {option.label}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary" />

              <span className="text-xs text-text-secondary leading-tight">
                I accept the{' '}
                <Link
                  to="/data-policy"
                  className="text-primary hover:underline">

                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/data-policy"
                  className="text-primary hover:underline">

                  Privacy Policy
                </Link>
              </span>
            </label>

            <div className="flex gap-3 mt-6">
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                disabled={!acceptedTerms}
                className="flex-[4]">

                Login
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 px-0"
                onClick={() => alert('Biometric login not configured')}>

                <Fingerprint size={24} />
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-primary hover:underline">

                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>);

}