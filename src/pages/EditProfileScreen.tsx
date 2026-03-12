import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  DollarSign,
  Globe } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export function EditProfileScreen() {
  const navigate = useNavigate();
  const { role, userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>({
    full_name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    address: '',
    specialization: '',
    experience_years: '',
    fee: '',
    languages: '',
    bio: ''
  });

  useEffect(() => {
    const currentRole = localStorage.getItem("role");
    if (!currentRole) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/profile?user_id=${userId}&role=${role}`);
      const data = await response.json();
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          age: data.age?.toString() || '',
          gender: data.gender || 'Male',
          address: data.address || '',
          specialization: data.specialization || '',
          experience_years: data.experience_years?.toString() || '',
          fee: data.fee?.toString() || '',
          languages: data.languages || '',
          bio: data.bio || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          role: role,
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          // Including other fields as they were already there, but focusing on the requested ones
          age: profile.age,
          gender: profile.gender,
          specialization: profile.specialization,
          experience_years: profile.experience_years,
          fee: profile.fee,
          languages: profile.languages,
          bio: profile.bio
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Profile updated successfully");
        await loadProfile();
        navigate('/profile');
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      alert("Failed to update profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({ ...prev, [name]: value }));
  };


  return (
    <ScreenContainer title="Edit Profile" showBack>
      <div className="px-6 py-6">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <img
              src={role === 'doctor' 
                ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300"
                : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300"
              }
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />

            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <User size={14} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            name="full_name"
            id="name"
            value={profile.full_name}
            onChange={handleChange}
            icon={<User size={18} />} />

          <Input
            label="Email Address"
            name="email"
            id="email"
            value={profile.email}
            readOnly
            icon={<Mail size={18} />}
            type="email" />

          {role === 'patient' &&
          <>
              <Input
                label="Phone Number"
                name="phone"
                id="phone"
                value={profile.phone}
                onChange={handleChange}
                icon={<Phone size={18} />}
                type="tel" />
                
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Age" 
                  name="age"
                  id="age"
                  value={profile.age} 
                  onChange={handleChange}
                  type="number" />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary ml-1">
                    Gender
                  </label>
                  <select 
                    name="gender"
                    id="gender"
                    value={profile.gender}
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
                label="Address"
                name="address"
                id="address"
                value={profile.address}
                onChange={handleChange}
                icon={<MapPin size={18} />} />

            </>
          }

          {role === 'doctor' &&
          <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Specialization"
                  name="specialization"
                  id="specialization"
                  value={profile.specialization}
                  onChange={handleChange}
                  icon={<Briefcase size={18} />} />

                <Input
                  label="Experience (Years)"
                  name="experience_years"
                  id="experience_years"
                  value={profile.experience_years}
                  onChange={handleChange}
                  icon={<Award size={18} />}
                  type="number" />
              </div>

              <Input
                label="Consultation Fee ($)"
                name="fee"
                id="fee"
                value={profile.fee}
                onChange={handleChange}
                icon={<DollarSign size={18} />}
                type="number" />

              <Input
                label="Languages Spoken"
                name="languages"
                id="languages"
                value={profile.languages}
                onChange={handleChange}
                icon={<Globe size={18} />}
                placeholder="e.g. English, Hindi, Spanish" />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary ml-1">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  className="w-full p-4 rounded-xl border border-gray-200 bg-white text-text-primary focus:outline-none focus:border-primary min-h-[100px]"
                  placeholder="Tell us about yourself..." />
              </div>
            </>
          }

          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </ScreenContainer>);
}