import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { 
  isValidEmail, 
  isValidPhone, 
  getPasswordStrength, 
  isValidDob, 
  calcAgeFromDob,
  isValidCityState,
  INDIAN_STATES,
  toTitleCase 
} from "../utils/validators";

interface PatientForm {
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  city: string;
  state: string;
  password: string;
  confirm_password: string;
}

const INITIAL: PatientForm = {
  full_name: "", email: "", phone: "", gender: "",
  dob: "", city: "", state: "", password: "", confirm_password: "",
};

export default function PatientRegisterScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PatientForm>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof PatientForm, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PatientForm, boolean>>>({});
  const [showPwd, setShowPwd]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState("");

  const strength = getPasswordStrength(form.password);
  const strengthColor = { empty: "bg-gray-200", weak: "bg-red-500", medium: "bg-orange-500", strong: "bg-green-500" }[strength];
  const strengthWidth  = { empty: "w-0", weak: "w-1/3", medium: "w-2/3", strong: "w-full" }[strength];

  const passwordChecks = [
    { label: "At least 8 characters",    pass: form.password.length >= 8 },
    { label: "One uppercase letter",      pass: /[A-Z]/.test(form.password) },
    { label: "One lowercase letter",      pass: /[a-z]/.test(form.password) },
    { label: "One number",                pass: /[0-9]/.test(form.password) },
    { label: "One special character (!@#$%^&*()_+=-)", pass: /[!@#$%^&*()_+=\-]/.test(form.password) },
  ];

  const validateField = (name: keyof PatientForm, value: string) => {
    let error = "";
    switch (name) {
      case "full_name":
        if (!value.trim()) error = "Full name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        else if (!/^[A-Za-z][A-Za-z '\-]{1,59}$/.test(value.trim())) error = "Name can only contain letters, spaces, hyphens and apostrophes";
        break;
      case "email":
        if (!value.trim()) error = "Email address is required";
        else if (!isValidEmail(value)) error = "Enter a valid email address (e.g. name@example.com)";
        break;
      case "phone":
        if (!value.trim()) error = "Mobile number is required";
        else if (value.length !== 10) error = "Mobile number must be exactly 10 digits";
        else if (!isValidPhone(value)) error = "Valid Indian mobile number starts with 6, 7, 8 or 9";
        break;
      case "gender":
        if (!value) error = "Please select your gender";
        break;
      case "dob":
        if (!value) error = "Date of birth is required";
        else if (!isValidDob(value, 18, 100)) {
          const age = calcAgeFromDob(value);
          if (age < 18) error = "You must be at least 18 years old to register";
          else if (age > 100) error = "Please enter a valid date of birth";
          else if (new Date(value) > new Date()) error = "Date of birth cannot be in the future";
        }
        break;
      case "city":
        if (!value.trim()) error = "City is required";
        else if (!isValidCityState(value)) error = "Enter a valid city name";
        break;
      case "state":
        if (!value) error = "State is required";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8) error = "Password must be at least 8 characters";
        else if (/\s/.test(value)) error = "Password cannot contain spaces";
        else if (strength !== "strong") error = "Password is too weak. Meet all requirements below.";
        break;
      case "confirm_password":
        if (!value) error = "Please confirm your password";
        else if (value !== form.password) error = "Passwords do not match";
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (name: keyof PatientForm) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, form[name]);
  };

  const handleAction = (name: keyof PatientForm, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    
    // Fully validate all fields
    const hasErrors = Object.values(errors).some(err => !!err) || 
                     (Object.keys(form) as (keyof PatientForm)[]).some(k => !form[k]);

    if (hasErrors) return;

    setLoading(true);
    try {
      const res = await fetch("/api/register/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email:     form.email.trim().toLowerCase(),
          password:  form.password,
          phone:     form.phone,
          age:       calcAgeFromDob(form.dob),
          gender:    form.gender,
          address:   `${form.city.trim()}, ${form.state}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "Registration failed. Please try again.");
        return;
      }
      navigate("/login", { state: { message: "Registration successful! Please log in." } });
    } catch {
      setApiError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = !Object.values(errors).some(e => !!e) && 
                      form.full_name && form.email && form.phone && form.gender && 
                      form.dob && form.city && form.state && 
                      form.password && form.confirm_password && strength === "strong" &&
                      form.password === form.confirm_password;

  const maxDobStr = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0];
  const minDobStr = new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-2xl p-8">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-primary">← Back</button>
          <h1 className="text-2xl font-bold text-text-primary">Patient Registration</h1>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

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

          <div className="relative">
            <Input label="Mobile Number *" placeholder="Enter 10-digit mobile number"
              value={form.phone} error={touched.phone ? errors.phone : ""} maxLength={10} type="tel"
              onBlur={() => handleBlur("phone")}
              onChange={e => handleAction("phone", e.target.value.replace(/\D/g, ""))} />
            {form.phone.length === 10 && !errors.phone && (
              <span className="absolute right-3 top-10 text-green-500 font-bold">✓</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-secondary">Gender *</label>
              <select value={form.gender}
                onBlur={() => handleBlur("gender")}
                onChange={e => handleAction("gender", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select gender</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
              {touched.gender && errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
            </div>
            <Input label="Date of Birth *" type="date" value={form.dob} error={touched.dob ? errors.dob : ""}
              max={maxDobStr} min={minDobStr}
              onBlur={() => handleBlur("dob")}
              onChange={e => handleAction("dob", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="City *" placeholder="Enter city" value={form.city} error={touched.city ? errors.city : ""}
              onBlur={() => handleBlur("city")}
              onChange={e => {
                const cleaned = e.target.value.replace(/[^A-Za-z\s.\-]/g, "");
                handleAction("city", cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
              }} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-secondary">State *</label>
              <select value={form.state}
                onBlur={() => handleBlur("state")}
                onChange={e => handleAction("state", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
              {touched.state && errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
            </div>
          </div>

          <div>
            <div className="relative">
              <Input label="Password *" type={showPwd ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password} error={touched.password ? errors.password : ""}
                onBlur={() => handleBlur("password")}
                onChange={e => handleAction("password", e.target.value.replace(/\s/g, ""))} />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                className="absolute right-3 top-9 text-text-secondary">
                {showPwd ? "🙈" : "👁"}
              </button>
            </div>
            
            {form.password && (
              <div className="mt-2 space-y-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strengthColor} ${strengthWidth}`} />
                </div>
                <ul className="grid grid-cols-2 gap-1">
                  {passwordChecks.map(c => (
                    <li key={c.label} className={`flex items-center gap-1.5 text-[10px] font-medium ${c.pass ? "text-green-600" : "text-gray-400"}`}>
                      <span>{c.pass ? "✓" : "✗"}</span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="relative">
            <Input label="Confirm Password *" type={showConf ? "text" : "password"}
              placeholder="Re-enter password"
              value={form.confirm_password} error={touched.confirm_password ? errors.confirm_password : ""}
              onBlur={() => handleBlur("confirm_password")}
              onChange={e => handleAction("confirm_password", e.target.value)} />
            <button type="button" onClick={() => setShowConf(p => !p)}
              className="absolute right-3 top-9 text-text-secondary">
              {showConf ? "🙈" : "👁"}
            </button>
            {form.confirm_password && (
              <span className={`absolute right-10 top-9 text-sm ${form.confirm_password === form.password ? "text-green-500" : "text-red-500"}`}>
                {form.confirm_password === form.password ? "✓" : "✗"}
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">Back</Button>
            <Button type="submit" variant="primary" fullWidth isLoading={loading}
              disabled={!isFormValid || loading} className="flex-1">
              Register
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
