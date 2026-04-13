import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Stethoscope,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { RadioGroup } from '../components/ui/RadioGroup';

export function RegistrationScreen() {
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');

  const roleOptions = [
    {
      id: 'patient',
      label: 'Patient',
      icon: <User size={20} />,
      description: 'Book appointments and consult doctors'
    },
    {
      id: 'doctor',
      label: 'Doctor',
      icon: <Stethoscope size={20} />,
      description: 'Manage patients and provide consultations'
    }
  ];

  const handleContinue = () => {
    if (role === 'patient') {
      navigate('/register/patient');
    } else {
      navigate('/register/doctor');
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-soft my-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            Create Account
          </h1>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Choose your role</h2>
            <p className="text-text-secondary">How will you use the platform?</p>
          </div>

          <RadioGroup
            name="role"
            options={roleOptions}
            value={role}
            onChange={setRole}
          />

          <Button type="button" fullWidth onClick={handleContinue}>
            Continue
          </Button>
          
          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary font-bold hover:underline"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
