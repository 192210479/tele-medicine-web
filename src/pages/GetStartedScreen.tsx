import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, UserPlus, LogIn } from 'lucide-react';
import { Button } from '../components/ui/Button';
export function GetStartedScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-primary via-blue-600 to-blue-700 flex flex-col relative overflow-hidden items-center justify-center">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2" />
      <div className="absolute bottom-1/3 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2" />

      {/* Content */}
      <div className="w-full max-w-md mx-auto px-6 z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-10">
          <Activity size={64} className="text-primary" />
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-3 text-center">
          Telemedicine Remote Care
        </h1>
        <p className="text-blue-100 text-xl font-medium mb-12 text-center">
          Healthcare at your fingertips
        </p>

        {/* Features list */}
        <div className="w-full space-y-4 mb-12">
          <div className="flex items-center gap-4 text-white/90 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <span className="text-base font-medium">
              24/7 Doctor Consultations
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/90 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <span className="text-base font-medium">Digital Prescriptions</span>
          </div>
          <div className="flex items-center gap-4 text-white/90 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <span className="text-base font-medium">
              Secure Medical Records
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="w-full space-y-4">
          <Button
            fullWidth
            onClick={() => navigate('/login')}
            icon={<LogIn size={20} />}>
            
            Login
          </Button>

          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate('/register')}
            icon={<UserPlus size={20} />}>
            
            Create Account
          </Button>

          <button
            onClick={() => navigate('/login')}
            className="w-full text-center text-white/70 text-base font-medium py-3 hover:text-white transition-colors">
            
            Continue as Guest
          </button>
        </div>
      </div>
    </div>);

}
