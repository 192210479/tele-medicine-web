import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  DollarSign,
  Camera,
  MapPin } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useProfile, PatientProfile, DoctorProfile } from '../context/ProfileContext';
import { getAuth } from '../utils/auth';

export function EditProfileScreen() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { profile, updateLocalProfile } = useProfile();
  const auth = getAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    age: '',
    gender: 'Male',
    city: '',
    state: '',
    specialization: '',
    experience_years: '',
    fee: '',
    languages: '',
    bio: '',
    license_number: '',
  });

  // Populate form from context
  useEffect(() => {
    if (profile) {
      if (profile.role === 'patient') {
        const p = profile as PatientProfile;
        setForm(f => ({
          ...f,
          full_name: p.full_name,
          phone: p.phone,
          age: p.age?.toString() || '',
          gender: p.gender || 'Male',
          city: p.city,
          state: p.state,
        }));
      } else if (profile.role === 'doctor') {
        const d = profile as DoctorProfile;
        setForm(f => ({
          ...f,
          full_name: d.full_name,
          specialization: d.specialization,
          experience_years: d.experience_years?.toString() || '',
          fee: d.fee?.toString() || '',
          languages: d.languages,
          bio: d.bio,
          license_number: d.license_number,
        }));
      } else if (profile.role === 'admin') {
        setForm(f => ({
          ...f,
          full_name: profile.full_name || '',
        }));
      }
    }
  }, [profile]);

  const validateForm = (): boolean => {
    const e: Record<string, string> = {};
    const userRole = profile?.role || role;

    // Full Name
    if (!form.full_name.trim() || form.full_name.trim().length < 2)
      e.full_name = "Full name must be at least 2 characters";
    else if (!/^[A-Za-z][A-Za-z '\-]{1,59}$/.test(form.full_name.trim()))
      e.full_name = "Name can only contain letters, spaces, hyphens and apostrophes";

    if (userRole === 'patient') {
      // Phone
      if (!form.phone)
        e.phone = "Mobile number is required";
      else if (!/^[6-9][0-9]{9}$/.test(form.phone))
        e.phone = "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9";

      // Age
      if (!form.age)
        e.age = "Age is required";
      else {
        const ageNum = parseInt(form.age, 10);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 100)
          e.age = "Age must be between 18 and 100";
      }

      // Gender
      if (!form.gender)
        e.gender = "Please select your gender";

      // City
      if (!form.city.trim() || form.city.trim().length < 2)
        e.city = "City must be at least 2 characters";
      else if (!/^[A-Za-z][A-Za-z\s.\-]+$/.test(form.city.trim()))
        e.city = "City name can only contain letters, spaces, hyphens and dots";

      // State
      if (!form.state.trim() || form.state.trim().length < 2)
        e.state = "State must be at least 2 characters";
      else if (!/^[A-Za-z][A-Za-z\s\-]+$/.test(form.state.trim()))
        e.state = "State name can only contain letters and spaces";
    }

    if (userRole === 'doctor') {
      // Specialization
      if (!form.specialization)
        e.specialization = "Please select your specialization";

      // License number
      if (form.license_number && !/^[A-Z0-9\-\/]{5,20}$/.test(form.license_number))
        e.license_number = "License number: 5–20 characters, letters/digits/hyphens only";

      // Experience
      if (form.experience_years !== "") {
        const n = parseInt(form.experience_years, 10);
        if (isNaN(n) || n < 0 || n > 60)
          e.experience_years = "Experience must be between 0 and 60 years";
      }

      // Fee
      if (!form.fee)
        e.fee = "Consultation fee is required";
      else {
        const n = parseFloat(form.fee);
        if (isNaN(n) || n < 50 || n > 100000)
          e.fee = "Fee must be between ₹50 and ₹1,00,000";
      }

      // Languages
      if (form.languages.trim()) {
        const langs = form.languages.split(",").map(l => l.trim());
        const invalid = langs.find(l => l.length > 0 && !/^[A-Za-z\s]{2,30}$/.test(l));
        if (invalid)
          e.languages = "Each language must be letters only, min 2 characters";
      }

      // Bio
      if (form.bio.length > 500)
        e.bio = "Bio cannot exceed 500 characters";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !validateForm()) return;
    
    setSaving(true);
    setError('');
    setSuccessMsg('');

    const userRole = profile?.role || role;
    
    const payload: any = {
      user_id:   auth.user_id,
      role:      userRole,
      full_name: form.full_name.trim(),
    };

    if (userRole === 'patient') {
      payload.phone = form.phone;
      payload.age = parseInt(form.age, 10);
      payload.gender = form.gender;
      payload.address = `${form.city.trim()}, ${form.state.trim()}`;
    } else if (userRole === 'doctor') {
      payload.specialization = form.specialization;
      payload.experience_years = parseInt(form.experience_years, 10);
      payload.fee = parseFloat(form.fee);
      payload.languages = form.languages;
      payload.bio = form.bio;
      payload.license_number = form.license_number;
    }

    try {
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }

      // Update global context
      const localUpdates: any = { full_name: form.full_name.trim() };
      if (userRole === 'patient') {
        localUpdates.phone = form.phone;
        localUpdates.age = parseInt(form.age, 10);
        localUpdates.gender = form.gender;
        localUpdates.city = form.city.trim();
        localUpdates.state = form.state.trim();
        localUpdates.address = `${form.city.trim()}, ${form.state.trim()}`;
      } else {
        localUpdates.specialization = form.specialization;
        localUpdates.experience_years = parseInt(form.experience_years, 10);
        localUpdates.fee = parseFloat(form.fee);
        localUpdates.languages = form.languages;
        localUpdates.bio = form.bio;
        localUpdates.license_number = form.license_number;
      }
      updateLocalProfile(localUpdates);

      setSuccessMsg("Profile updated successfully");
      setTimeout(() => navigate('/profile'), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, or WEBP images allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", String(auth.user_id));
    formData.append("role",    auth.role);
    formData.append("image",   file);

    try {
      const res  = await fetch("/api/profile/image/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Image upload failed"); return; }
      updateLocalProfile({ profile_image: `${data.url}&t=${Date.now()}` });
      setSuccessMsg("Image updated successfully");
    } catch { setError("Image upload failed. Please try again."); }
  };

  // Formatting Handlers
  const handleNameChange = (val: string) => {
    const cleaned = val.replace(/[^A-Za-z '\-]/g, "");
    const titled  = cleaned.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    setForm(f => ({ ...f, full_name: titled }));
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setForm(f => ({ ...f, phone: digits }));
  };

  const handleCityChange = (val: string) => {
    const cleaned = val.replace(/[^A-Za-z\s.\-]/g, "");
    const titled  = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    setForm(f => ({ ...f, city: titled }));
  };

  const handleStateChange = (val: string) => {
    const cleaned = val.replace(/[^A-Za-z\s\-]/g, "");
    const titled  = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    setForm(f => ({ ...f, state: titled }));
  };

  const handleLicenseChange = (val: string) => {
    const cleaned = val.replace(/[^A-Za-z0-9\-\/]/g, "").toUpperCase().slice(0, 20);
    setForm(f => ({ ...f, license_number: cleaned }));
  };

  const handleLanguagesBlur = () => {
    const titled = form.languages.split(",")
      .map(l => l.trim().charAt(0).toUpperCase() + l.trim().slice(1).toLowerCase())
      .filter(l => l.length > 0)
      .join(", ");
    setForm(f => ({ ...f, languages: titled }));
  };

  const patient = profile?.role === 'patient';
  const doctor = profile?.role === 'doctor';

  return (
    <ScreenContainer title="Edit Profile" showBack>
      <div className="px-6 py-6">
        <div className="flex justify-center mb-8">
          <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center">
              {profile?.profile_image ? (
                <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">{profile?.full_name?.charAt(0)}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <Camera size={14} />
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100">{successMsg}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={(e: any) => handleNameChange(e.target.value)} icon={<User size={18} />} error={errors.full_name} />
          
          <div className="relative">
            <Input label="Email Address" value={profile?.email || ""} readOnly disabled className="bg-gray-50 cursor-not-allowed opacity-75" icon={<Mail size={18} />} />
            <span className="absolute right-3 top-9 text-gray-400 text-sm" title="Email cannot be changed">🔒</span>
            <p className="text-xs text-text-secondary mt-1 ml-1">Email address cannot be changed after registration.</p>
          </div>

          {patient && (
            <>
              <Input label="Phone Number" value={form.phone} onChange={(e: any) => handlePhoneChange(e.target.value)} icon={<Phone size={18} />} error={errors.phone} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Age" value={form.age} onChange={(e: any) => setForm(f => ({ ...f, age: e.target.value.replace(/\D/g, "").slice(0, 3) }))} type="number" error={errors.age} />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary ml-1">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-text-primary focus:outline-none focus:border-primary">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" value={form.city} onChange={(e: any) => handleCityChange(e.target.value)} error={errors.city} />
                <Input label="State" value={form.state} onChange={(e: any) => handleStateChange(e.target.value)} error={errors.state} />
              </div>
            </>
          )}

          {doctor && (
            <>
              <Input label="Specialization" value={form.specialization} onChange={(e: any) => setForm(f => ({ ...f, specialization: e.target.value }))} icon={<Briefcase size={18} />} error={errors.specialization} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Experience (Years)" value={form.experience_years} onChange={(e: any) => setForm(f => ({ ...f, experience_years: e.target.value.replace(/\D/g, "") }))} icon={<Award size={18} />} type="number" error={errors.experience_years} />
                <Input label="Consultation Fee (₹)" value={form.fee} onChange={(e: any) => setForm(f => ({ ...f, fee: e.target.value.replace(/[^0-9.]/g, "") }))} icon={<DollarSign size={18} />} type="number" error={errors.fee} />
              </div>
              <Input label="License Number" value={form.license_number} onChange={(e: any) => handleLicenseChange(e.target.value)} error={errors.license_number} />
              <Input label="Languages Spoken" value={form.languages} onChange={(e: any) => setForm(f => ({ ...f, languages: e.target.value.replace(/[^A-Za-z,\s]/g, "") }))} onBlur={handleLanguagesBlur} error={errors.languages} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary ml-1">Bio / About</label>
                <textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value.slice(0, 500) }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-text-primary focus:outline-none focus:border-primary min-h-[100px] resize-none" />
                <p className="text-right text-[10px] text-gray-400">{form.bio.length}/500</p>
                {errors.bio && <p className="text-xs text-red-500">{errors.bio}</p>}
              </div>
            </>
          )}

          <div className="pt-4 pb-8">
            <Button type="submit" fullWidth isLoading={saving} disabled={saving}>Save Changes</Button>
          </div>
        </form>
      </div>
    </ScreenContainer>
  );
}
