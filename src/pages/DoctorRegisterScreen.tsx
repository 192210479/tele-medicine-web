import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { 
  isValidEmail, 
  getPasswordStrength, 
  toTitleCase,
  validateFile,
  formatFileSize,
  isValidLicenseNumber,
  isValidExperience,
  isValidFee,
} from "../utils/validators";

const SPECIALIZATIONS = [
  "Cardiologist", "Dermatologist", "Neurologist", "Orthopedic Surgeon",
  "Pediatrician", "Psychiatrist", "Gynecologist", "General Physician",
  "ENT Specialist", "Ophthalmologist", "Urologist", "Oncologist",
  "Endocrinologist", "Pulmonologist", "Gastroenterologist",
  "Rheumatologist", "Nephrologist", "Hematologist",
  "Infectious Disease Specialist", "Other"
];

interface DoctorForm {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  specialization: string;
  license_number: string;
  experience_years: string;
  fee: string;
  languages: string;
  bio: string;
}

const INITIAL: DoctorForm = {
  full_name: "", email: "", password: "", confirm_password: "",
  specialization: "", license_number: "", experience_years: "", fee: "",
  languages: "", bio: "",
};

export default function DoctorRegisterScreen() {
  const navigate = useNavigate();
  const licenseRef = useRef<HTMLInputElement>(null);
  const medicalRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<DoctorForm>(INITIAL);
  const [licenseFile, setLicenseFile]   = useState<File | null>(null);
  const [medicalFile, setMedicalFile]   = useState<File | null>(null);
  const [errors, setErrors]             = useState<Partial<Record<keyof DoctorForm | "license_file" | "medical_file", string>>>({});
  const [touched, setTouched]           = useState<Partial<Record<keyof DoctorForm, boolean>>>({});
  
  const [showPwd, setShowPwd]           = useState(false);
  const [showConf, setShowConf]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [apiError, setApiError]         = useState("");
  const [success, setSuccess]           = useState(false);

  const strength = getPasswordStrength(form.password);
  const strengthColor = { empty: "bg-gray-200", weak: "bg-red-500", medium: "bg-orange-500", strong: "bg-green-500" }[strength];
  const strengthWidth  = { empty: "w-0", weak: "w-1/3", medium: "w-2/3", strong: "w-full" }[strength];

  const passwordChecks = [
    { label: "At least 8 characters",    pass: form.password.length >= 8 },
    { label: "One uppercase (A-Z)",      pass: /[A-Z]/.test(form.password) },
    { label: "One lowercase (a-z)",      pass: /[a-z]/.test(form.password) },
    { label: "One number (0-9)",         pass: /[0-9]/.test(form.password) },
    { label: "One special char",         pass: /[!@#$%^&*()_+=\-]/.test(form.password) },
  ];

  const validateField = (name: keyof DoctorForm, value: string) => {
    let error = "";
    switch (name) {
      case "full_name":
        if (!value.trim()) error = "Full name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        else if (!/^[A-Za-z][A-Za-z '\-]{1,59}$/.test(value.trim())) error = "Letters, spaces, hyphens and apostrophes only";
        break;
      case "email":
        if (!value.trim()) error = "Email address is required";
        else if (!isValidEmail(value)) error = "Enter a valid email address (e.g. name@example.com)";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8) error = "Password must be at least 8 characters";
        else if (/\s/.test(value)) error = "Password cannot contain spaces";
        else if (strength !== "strong") error = "Password is too weak";
        break;
      case "confirm_password":
        if (!value) error = "Please confirm your password";
        else if (value !== form.password) error = "Passwords do not match";
        break;
      case "specialization":
        if (!value) error = "Please select your specialization";
        break;
      case "license_number":
        if (!value.trim()) error = "License number is required";
        else if (value.trim().length < 5) error = "License number must be at least 5 characters";
        else if (!isValidLicenseNumber(value)) error = "Letters, numbers, hyphens and slashes only";
        break;
      case "experience_years":
        if (!value) error = "Years of experience is required";
        else if (!isValidExperience(value)) error = "Enter a valid number of years (0–60)";
        else if (value.includes(".")) error = "Please enter a whole number";
        break;
      case "fee":
        if (!value) error = "Consultation fee is required";
        else if (!isValidFee(value)) {
          const n = parseFloat(value);
          if (n < 50) error = "Minimum fee is ₹50";
          else if (n > 100000) error = "Maximum fee is ₹1,00,000";
          else error = "Enter a valid fee amount";
        }
        break;
      case "languages":
        if (value.trim()) {
          if (!/^[A-Za-z,\s]*$/.test(value)) error = "Letters and commas only";
          else {
            const hasShort = value.split(",").some(l => l.trim().length > 0 && l.trim().length < 2);
            if (hasShort) error = "Each language must be at least 2 characters";
          }
        }
        break;
      case "bio":
        if (value.length > 500) error = "Bio cannot exceed 500 characters";
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (name: keyof DoctorForm) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, form[name]);
  };

  const handleAction = (name: keyof DoctorForm, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
  };

  const isFormValid = !Object.values(errors).some(e => !!e) && 
    form.full_name && form.email && form.password && form.confirm_password &&
    form.specialization && form.license_number && form.experience_years && form.fee &&
    licenseFile && medicalFile && strength === "strong" &&
    form.password === form.confirm_password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    if (!isFormValid) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("full_name",        form.full_name.trim());
      fd.append("email",            form.email.trim().toLowerCase());
      fd.append("password",         form.password);
      fd.append("specialization",   form.specialization);
      fd.append("license_number",   form.license_number.trim().toUpperCase());
      fd.append("experience_years", form.experience_years);
      fd.append("fee",              form.fee);
      if (form.languages) fd.append("languages", form.languages);
      if (form.bio)        fd.append("bio",       form.bio);
      if (licenseFile)     fd.append("license_file",        licenseFile);
      if (medicalFile)     fd.append("medical_record_file", medicalFile);

      const res  = await fetch("/api/register/doctor", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error || "Registration failed.");
        return;
      }
      setSuccess(true);
    } catch {
      setApiError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-soft w-full max-w-md p-10 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Registration Submitted!</h2>
          <p className="text-text-secondary mb-6">Your account is under review. This usually takes 1–2 business days.</p>
          <Button variant="primary" fullWidth onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-3xl p-8">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-primary">← Back</button>
          <h1 className="text-2xl font-bold text-text-primary">Doctor Registration</h1>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{apiError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name *" placeholder="Enter full name"
                value={form.full_name} error={touched.full_name ? errors.full_name : ""}
                onBlur={() => handleBlur("full_name")}
                onChange={e => {
                  const cleaned = e.target.value.replace(/[^A-Za-z '\-]/g, "");
                  handleAction("full_name", toTitleCase(cleaned));
                }} />
              <Input label="Email Address *" type="email" placeholder="Enter valid email"
                value={form.email} error={touched.email ? errors.email : ""}
                onBlur={() => handleBlur("email")}
                onChange={e => handleAction("email", e.target.value.toLowerCase().trim())} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="relative">
                <Input label="Password *" type={showPwd ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password} error={touched.password ? errors.password : ""}
                  onBlur={() => handleBlur("password")}
                  onChange={e => handleAction("password", e.target.value.replace(/\s/g, ""))} />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-9 text-text-secondary">{showPwd?"🙈":"👁"}</button>
              </div>
              <div className="relative">
                <Input label="Confirm Password *" type={showConf ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={form.confirm_password} error={touched.confirm_password ? errors.confirm_password : ""}
                  onBlur={() => handleBlur("confirm_password")}
                  onChange={e => handleAction("confirm_password", e.target.value)} />
                <button type="button" onClick={() => setShowConf(p => !p)} className="absolute right-3 top-9 text-text-secondary">{showConf?"🙈":"👁"}</button>
                {form.confirm_password && (
                  <span className={`absolute right-10 top-9 text-sm ${form.confirm_password === form.password ? "text-green-500" : "text-red-500"}`}>
                    {form.confirm_password === form.password ? "✓" : "✗"}
                  </span>
                )}
              </div>
            </div>
            {form.password && (
              <div className="mt-2 space-y-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strengthColor} ${strengthWidth}`} />
                </div>
                <ul className="grid grid-cols-3 gap-1">
                  {passwordChecks.map(c => (
                    <li key={c.label} className={`flex items-center gap-1.5 text-[10px] font-medium ${c.pass ? "text-green-600" : "text-gray-400"}`}>
                      <span>{c.pass ? "✓" : "✗"}</span> {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Professional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-secondary">Specialization *</label>
                <select value={form.specialization} onBlur={() => handleBlur("specialization")}
                  onChange={e => handleAction("specialization", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
                {touched.specialization && errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization}</p>}
              </div>
              <Input label="License Number *" placeholder="Enter valid license number"
                value={form.license_number} error={touched.license_number ? errors.license_number : ""}
                onBlur={() => handleBlur("license_number")}
                onChange={e => handleAction("license_number", e.target.value.replace(/[^A-Za-z0-9\-\/]/g, "").toUpperCase())} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input label="Years of Experience *" type="number" placeholder="e.g. 5"
                min="0" max="60" step="1" value={form.experience_years} error={touched.experience_years ? errors.experience_years : ""}
                onBlur={() => handleBlur("experience_years")}
                onChange={e => handleAction("experience_years", e.target.value)} />
              <Input label="Consultation Fee (₹) *" type="number" placeholder="Min ₹50"
                min="50" max="100000" step="0.01" value={form.fee} error={touched.fee ? errors.fee : ""}
                onBlur={() => handleBlur("fee")}
                onChange={e => handleAction("fee", e.target.value)} />
            </div>
            <div className="mt-4">
              <Input label="Languages Spoken" placeholder="e.g. English, Hindi"
                value={form.languages} error={touched.languages ? errors.languages : ""}
                onChange={e => handleAction("languages", e.target.value.replace(/[^A-Za-z,\s]/g, ""))}
                onBlur={() => {
                  const titled = form.languages.split(",").map(l => l.trim().charAt(0).toUpperCase() + l.trim().slice(1).toLowerCase()).filter(l => l).join(", ");
                  handleAction("languages", titled);
                  handleBlur("languages");
                }} />
            </div>
            <div className="mt-4 flex flex-col gap-1">
              <label className="text-sm font-medium text-text-secondary">Bio / About</label>
              <textarea value={form.bio} onChange={e => {
                const val = e.target.value;
                const capped = val.slice(0, 500);
                const titled = capped.length > 0 ? capped.charAt(0).toUpperCase() + capped.slice(1) : capped;
                handleAction("bio", titled);
              }}
                maxLength={500} rows={3} placeholder="Brief description (optional)"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              <p className="text-xs text-text-secondary text-right">{form.bio.length}/500</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Document Uploads</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-text-secondary block mb-1">License Document (PDF/JPG/PNG/DOC) *</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-primary transition-colors cursor-pointer"
                onClick={() => licenseRef.current?.click()}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">{licenseFile ? licenseFile.name : "Upload license"}</p>
                    <p className="text-xs text-text-secondary">{licenseFile ? formatFileSize(licenseFile.size) : "Max 16MB"}</p>
                  </div>
                </div>
                {licenseFile ? <span className="text-green-500">✓</span> : <span className="text-primary text-sm font-medium">Browse</span>}
              </div>
              <input ref={licenseRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const err = validateFile(f);
                  if (err) setErrors(prev => ({ ...prev, license_file: err }));
                  else { setLicenseFile(f); setErrors(prev => ({ ...prev, license_file: "" })); }
                }} />
              {errors.license_file && <p className="text-xs text-red-500 mt-1">{errors.license_file}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-1">Medical Records Document *</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-primary transition-colors cursor-pointer"
                onClick={() => medicalRef.current?.click()}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">{medicalFile ? medicalFile.name : "Upload medical records"}</p>
                    <p className="text-xs text-text-secondary">{medicalFile ? formatFileSize(medicalFile.size) : "Max 16MB"}</p>
                  </div>
                </div>
                {medicalFile ? <span className="text-green-500">✓</span> : <span className="text-primary text-sm font-medium">Browse</span>}
              </div>
              <input ref={medicalRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const err = validateFile(f);
                  if (err) setErrors(prev => ({ ...prev, medical_file: err }));
                  else { setMedicalFile(f); setErrors(prev => ({ ...prev, medical_file: "" })); }
                }} />
              {errors.medical_file && <p className="text-xs text-red-500 mt-1">{errors.medical_file}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">Back</Button>
            <Button type="submit" variant="primary" fullWidth isLoading={loading}
              disabled={!isFormValid || loading} className="flex-1">Register</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
