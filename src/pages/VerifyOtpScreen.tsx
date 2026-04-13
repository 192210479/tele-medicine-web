import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { authApi } from '../services/authApi';

export function VerifyOtpScreen() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600 seconds)

  const email = localStorage.getItem('resetEmail');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
    // Auto-focus first input on load
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
       // Paste case handling
       const pastedValue = value.replace(/\D/g, '').slice(0, 6);
       if (pastedValue) {
         const newOtp = [...otp];
         for (let i = 0; i < pastedValue.length; i++) {
           newOtp[i] = pastedValue[i];
         }
         setOtp(newOtp);
         if (pastedValue.length === 6) {
           inputRefs.current[5]?.focus();
         } else {
           inputRefs.current[pastedValue.length]?.focus();
         }
       }
       return;
    }

    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const otpString = otp.join('');
    if (otpString.length < 6) {
      setErrorMsg('Please enter the verification code');
      return;
    }

    if (timeLeft <= 0) {
      setErrorMsg('OTP expired');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await authApi.verifyOtp(email, otpString);
      // Success, move to reset password screen
      navigate('/reset-password');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setErrorMsg('');
    try {
      await authApi.sendOtp(email);
      setTimeLeft(600);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-soft">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            Verify OTP
          </h1>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <KeyRound size={32} />
            </div>
            <p className="text-text-secondary">
              Enter the 6-digit code sent to <br />
              <span className="font-medium text-text-primary">{email}</span>
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={6} // allowing 6 for paste handling
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                  disabled={isLoading}
                />
              ))}
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Verify OTP
            </Button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm font-medium text-text-secondary">
              {timeLeft > 0 ? (
                <span>Expires in <span className="text-primary">{formatTime(timeLeft)}</span></span>
              ) : (
                <span className="text-red-500">OTP Expired</span>
              )}
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || timeLeft > 540} // Prevent spamming, allow only if passed 1 minute
              className={`text-sm font-semibold transition-colors ${isResending || timeLeft > 540 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:text-primary-dark'}`}
            >
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
