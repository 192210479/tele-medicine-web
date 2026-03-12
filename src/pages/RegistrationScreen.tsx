import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Stethoscope,
  Mail,
  Lock,
  Calendar,
  CreditCard,
  ArrowLeft,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Globe,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RadioGroup } from '../components/ui/RadioGroup';
import { apiPost } from '../services/api';

export function RegistrationScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('patient');
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    specialization: '',
    license_number: '',
    experience_years: '',
    fee: '',
    languages: '',
    bio: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = role === 'patient' ? '/api/register/patient' : '/api/register/doctor';
      
      const payload = role === 'patient' 
        ? {
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
            age: parseInt(formData.age),
            gender: formData.gender,
            phone: formData.phone,
            address: formData.address
          }
        : {
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
            specialization: formData.specialization,
            license_number: formData.license_number,
            experience_years: parseInt(formData.experience_years),
            fee: parseFloat(formData.fee),
            languages: formData.languages,
            bio: formData.bio
          };

      const response = await apiPost(endpoint, payload);
      alert(response.message || 'Registration successful!');
      navigate('/login');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-soft">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => step === 1 ? navigate(-1) : setStep(1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            Create Account
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  Choose your role
                </h2>
                <p className="text-text-secondary">
                  How will you use the platform?
                </p>
              </div>

              <RadioGroup
                name="role"
                options={roleOptions}
                value={role}
                onChange={setRole}
              />

              <Button type="button" fullWidth onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  {role === 'patient' ? 'Patient Details' : 'Doctor Details'}
                </h2>
                <p className="text-text-secondary">
                  Please fill in your information
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  icon={<User size={18} />}
                  required
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  icon={<Mail size={18} />}
                  required
                />
              </div>

              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                icon={<Lock size={18} />}
                required
              />

              {role === 'patient' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="25"
                      required
                    />

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary ml-1">
                        Gender
                      </label>
                      <select 
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-text-primary focus:outline-none focus:border-primary"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    icon={<Phone size={18} />}
                    required
                  />
                  <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street, City, State"
                    icon={<MapPin size={18} />}
                    required
                  />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="Cardiologist"
                      icon={<Stethoscope size={18} />}
                      required
                    />

                    <Input
                      label="License Number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      placeholder="MED-123456"
                      icon={<CreditCard size={18} />}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Experience (Years)"
                      name="experience_years"
                      type="number"
                      value={formData.experience_years}
                      onChange={handleChange}
                      placeholder="5"
                      icon={<Briefcase size={18} />}
                      required
                    />
                    <Input
                      label="Consultation Fee ($)"
                      name="fee"
                      type="number"
                      value={formData.fee}
                      onChange={handleChange}
                      placeholder="50"
                      icon={<DollarSign size={18} />}
                      required
                    />
                  </div>
                  <Input
                    label="Languages"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    placeholder="English, Spanish"
                    icon={<Globe size={18} />}
                    required
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-secondary ml-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      className="w-full p-4 min-h-[100px] rounded-xl border border-gray-200 bg-white text-text-primary focus:outline-none focus:border-primary transition-all"
                      required
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  className="flex-[2]"
                >
                  Register
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}