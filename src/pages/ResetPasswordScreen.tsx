import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };
  return (
    <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-soft">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">

            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            Reset Password
          </h1>
        </div>

        {!isSent ?
        <div className="space-y-6">
            <div>
              <p className="text-text-secondary">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
              <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={<Mail size={18} />}
              required />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          </div> :

        <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
              <Mail size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Check your email
              </h2>
              <p className="text-text-secondary">
                We've sent a password reset link to your email address.
              </p>
            </div>
            <Button
            fullWidth
            onClick={() => navigate('/login')}
            variant="secondary">

              Back to Login
            </Button>
          </div>
        }
      </div>
    </div>);

}