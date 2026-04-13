// ── Name validator ────────────────────────────────────────────────
// Allows: letters (A-Z a-z), spaces, hyphens, apostrophes
// Blocks: numbers, special chars like @#$%
export function isValidName(value: string): boolean {
  return /^[A-Za-z][A-Za-z '\-]{1,}$/.test(value.trim());
}

// Auto-capitalize each word (Title Case)
// "john doe" → "John Doe"
export function toTitleCase(value: string): string {
  return value
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ── Email validator ───────────────────────────────────────────────
export function isValidEmail(value: string): boolean {
  return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(value.trim());
}

// ── Phone validator (Indian mobile numbers) ───────────────────────
// Must start with 6, 7, 8, or 9 followed by exactly 9 digits
export function isValidPhone(value: string): boolean {
  return /^[6-9][0-9]{9}$/.test(value.trim());
}

// ── Password strength ─────────────────────────────────────────────
export type PasswordStrength = "empty" | "weak" | "medium" | "strong";

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";
  if (password.length < 8) return "weak";
  const hasUpper   = /[A-Z]/.test(password);
  const hasLower   = /[a-z]/.test(password);
  const hasDigit   = /[0-9]/.test(password);
  // Match backend special char set: ! @ # $ % ^ & * ( ) _ + = -
  const hasSpecial = /[!@#$%^&*()_+=\-]/.test(password);
  
  if (hasUpper && hasLower && hasDigit && hasSpecial) return "strong";
  if ((hasUpper || hasLower) && hasDigit) return "medium";
  return "weak";
}

export function isStrongPassword(password: string): boolean {
  return getPasswordStrength(password) === "strong";
}

// ── City / State / Text fields ────────────────────────────────────
// Allow letters, spaces, hyphens, dots (for names like "St. Louis")
export function isValidCityState(value: string): boolean {
  return /^[A-Za-z][A-Za-z\s.\-]{1,}$/.test(value.trim());
}

// ── License number ────────────────────────────────────────────────
// Alphanumeric, 5–20 characters
export function isValidLicenseNumber(value: string): boolean {
  return /^[A-Za-z0-9\-\/]{5,20}$/.test(value.trim());
}

// ── Experience years ──────────────────────────────────────────────
export function isValidExperience(value: string): boolean {
  const n = parseInt(value, 10);
  return !isNaN(n) && n >= 0 && n <= 60;
}

// ── Consultation fee ──────────────────────────────────────────────
export function isValidFee(value: string): boolean {
  const n = parseFloat(value);
  return !isNaN(n) && n >= 50 && n <= 100000;
}

// ── Date of birth ─────────────────────────────────────────────────
export function calcAgeFromDob(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function isValidDob(dob: string, minAge = 18, maxAge = 120): boolean {
  if (!dob) return false;
  const age = calcAgeFromDob(dob);
  return age >= minAge && age <= maxAge;
}

// ── Bio / textarea ────────────────────────────────────────────────
export function isValidBio(value: string): boolean {
  return value.trim().length <= 500;
}

// ── Languages ─────────────────────────────────────────────────────
// Comma-separated, each language min 2 chars
export function isValidLanguages(value: string): boolean {
  if (!value.trim()) return true; // optional
  const langs = value.split(",").map(l => l.trim());
  return langs.every(l => /^[A-Za-z\s]{2,30}$/.test(l));
}

// ── File validator ────────────────────────────────────────────────
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB

export function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Only PDF, JPG, PNG, DOC, DOCX files are allowed";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File size must be under 16 MB";
  }
  return null; // valid
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli",
  "Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep",
  "Puducherry"
];

export const PATIENT_RULES = {
  full_name: {
    required: true,
    minLength: 2,
    maxLength: 60,
    pattern: /^[A-Za-z][A-Za-z '\-]{1,59}$/,
    autoFormat: toTitleCase,
    allowedChars: /[^A-Za-z '\-]/g,
    errors: {
      required: "Full name is required",
      minLength: "Name must be at least 2 characters",
      pattern:   "Name can only contain letters, spaces, hyphens and apostrophes",
    },
  },
  email: {
    required: true,
    maxLength: 254,
    pattern: /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/,
    autoFormat: (v: string) => v.toLowerCase(),
    errors: {
      required: "Email address is required",
      pattern:  "Enter a valid email address (e.g. name@example.com)",
      taken:    "This email is already registered. Please log in instead.",
    },
  },
  phone: {
    required: true,
    minLength: 10,
    maxLength: 10,
    pattern: /^[6-9][0-9]{9}$/,
    allowedChars: /\D/g,
    errors: {
      required:  "Mobile number is required",
      minLength: "Mobile number must be exactly 10 digits",
      pattern:   "Enter a valid Indian mobile number starting with 6, 7, 8 or 9",
    },
  },
  gender: {
    required: true,
    options: ["Male", "Female", "Other"],
    errors: {
      required: "Please select your gender",
    },
  },
  dob: {
    required: true,
    minAge: 18,
    maxAge: 100,
    errors: {
      required: "Date of birth is required",
      tooYoung: "You must be at least 18 years old to register",
      tooOld:   "Please enter a valid date of birth",
      future:   "Date of birth cannot be in the future",
    },
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[A-Za-z][A-Za-z\s.\-]+$/,
    allowedChars: /[^A-Za-z\s.\-]/g,
    autoFormat: (v: string) => v.charAt(0).toUpperCase() + v.slice(1),
    errors: {
      required:  "City is required",
      minLength: "Enter a valid city name",
      pattern:   "City name can only contain letters, spaces, hyphens and dots",
    },
  },
  state: {
    required: true,
    minLength: 2,
    maxLength: 50,
    errors: {
      required:  "State is required",
      minLength: "Enter a valid state name",
    },
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    noSpaces: true,
    errors: {
      required:   "Password is required",
      minLength:  "Password must be at least 8 characters",
      noSpaces:   "Password cannot contain spaces",
      noUpper:    "Add at least one uppercase letter (A-Z)",
      noLower:    "Add at least one lowercase letter (a-z)",
      noDigit:    "Add at least one number (0-9)",
      noSpecial:  "Add at least one special character (e.g. @, #, $, !)",
      weak:       "Password is too weak. Use a mix of uppercase, lowercase, numbers and symbols",
    },
  },
  confirm_password: {
    required: true,
    errors: {
      required:  "Please confirm your password",
      mismatch:  "Passwords do not match",
    },
  },
};

export const DOCTOR_EXTRA_RULES = {
  specialization: {
    required: true,
    errors: { required: "Please select your specialization" },
  },
  license_number: {
    required: true,
    minLength: 5,
    maxLength: 20,
    pattern: /^[A-Z0-9\-\/]{5,20}$/,
    autoFormat: (v: string) => v.replace(/[^A-Za-z0-9\-\/]/g, "").toUpperCase(),
    errors: {
      required:  "License number is required",
      minLength: "License number must be at least 5 characters",
      pattern:   "License number can only contain letters, numbers, hyphens and slashes",
    },
  },
  experience_years: {
    required: true,
    min: 0,
    max: 60,
    integer: true,
    errors: {
      required: "Years of experience is required",
      min:      "Experience cannot be negative",
      max:      "Please enter a valid number of years (0–60)",
      integer:  "Please enter a whole number",
    },
  },
  fee: {
    required: true,
    min: 50,
    max: 100000,
    errors: {
      required: "Consultation fee is required",
      min:      "Minimum fee is ₹50",
      max:      "Maximum fee is ₹1,00,000",
      invalid:  "Enter a valid fee amount",
    },
  },
  license_file: {
    required: true,
    allowedTypes: ["application/pdf","image/jpeg","image/png","application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    maxSizeBytes: 16 * 1024 * 1024,
    errors: {
      required:    "License document is required",
      invalidType: "Only PDF, JPG, PNG, DOC, DOCX files are allowed",
      tooLarge:    "File must be smaller than 16 MB",
    },
  },
  medical_record_file: {
    required: true,
    allowedTypes: ["application/pdf","image/jpeg","image/png","application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    maxSizeBytes: 16 * 1024 * 1024,
    errors: {
      required:    "Medical records document is required",
      invalidType: "Only PDF, JPG, PNG, DOC, DOCX files are allowed",
      tooLarge:    "File must be smaller than 16 MB",
    },
  },
};
