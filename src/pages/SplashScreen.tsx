import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Heart, Stethoscope, Pill } from 'lucide-react';
export function SplashScreen() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary via-blue-500 to-blue-600 flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large circles */}
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[40%] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[50%] bg-white/5 rounded-full blur-3xl" />

        {/* Floating medical icons */}
        <div className="absolute top-[15%] left-[10%] opacity-10 animate-float">
          <Heart size={40} />
        </div>
        <div className="absolute top-[25%] right-[15%] opacity-10 animate-float-delayed">
          <Stethoscope size={36} />
        </div>
        <div className="absolute bottom-[30%] left-[20%] opacity-10 animate-float">
          <Pill size={32} />
        </div>
        <div className="absolute bottom-[20%] right-[10%] opacity-10 animate-float-delayed">
          <Heart size={28} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center z-10">
        {/* Logo container with glow effect */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl scale-110" />
          <div className="relative w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
            <Activity size={64} className="text-primary" />
          </div>
        </div>

        {/* App name */}
        <h1 className="text-4xl font-bold mb-2 tracking-tight text-center">
          Telemedicine
        </h1>
        <h2 className="text-2xl font-medium text-blue-100 mb-1">Remote Care</h2>
        <p className="text-blue-200 text-base font-medium mt-2">
          Healthcare at your fingertips
        </p>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-16 flex gap-2">
        <div
          className="w-3 h-3 bg-white rounded-full animate-bounce"
          style={{
            animationDelay: '0s'
          }} />

        <div
          className="w-3 h-3 bg-white rounded-full animate-bounce"
          style={{
            animationDelay: '0.15s'
          }} />

        <div
          className="w-3 h-3 bg-white rounded-full animate-bounce"
          style={{
            animationDelay: '0.3s'
          }} />

      </div>

      {/* Version */}
      <p className="absolute bottom-6 text-blue-200/50 text-sm">
        Version 1.0.0
      </p>
    </div>);

}