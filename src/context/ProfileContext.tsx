import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAuth } from "../utils/auth";

export interface PatientProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string;
  city: string;       // split from address
  state: string;      // split from address
  address: string;    // raw "City, State" from backend
  profile_image: string | null;
}

export interface DoctorProfile {
  id: number;
  full_name: string;
  email: string;
  specialization: string;
  experience_years: number | null;
  fee: number | null;
  languages: string;
  bio: string;
  license_number: string;
  profile_image: string | null;
}

export type UserProfile = (PatientProfile & { role: "patient" }) | (DoctorProfile & { role: "doctor" }) | null;

interface ProfileContextValue {
  profile: any; // Using any for easier access in generic components, cast where needed
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateLocalProfile: (updates: any) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: false,
  fetchProfile: async () => {},
  updateLocalProfile: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    const auth = getAuth();
    if (!auth) {
      setProfile(null);
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`/api/profile?user_id=${auth.user_id}&role=${auth.role}`);
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return;
      }

      if (auth.role === "patient") {
        // Split "City, State" back into city and state
        const parts = (data.address || "").split(",");
        const city  = parts[0]?.trim() || "";
        const state = parts.slice(1).join(",").trim() || "";

        setProfile({
          id:            data.id,
          full_name:     data.full_name  || "",
          email:         data.email      || "",
          phone:         data.phone      || "",
          age:           data.age        ?? null,
          gender:        data.gender     || "",
          city,
          state,
          address:       data.address    || "",
          profile_image: data.profile_image || null,
          role:          "patient"
        });

      } else if (auth.role === "doctor") {
        setProfile({
          id:               data.id,
          full_name:        data.full_name        || "",
          email:            data.email            || "",
          specialization:   data.specialization   || "",
          experience_years: data.experience_years ?? null,
          fee:              data.fee              ?? null,
          languages:        data.languages        || "",
          bio:              data.bio              || "",
          license_number:   data.license_number   || "",
          profile_image:    data.profile_image    || null,
          role:             "doctor"
        });
      } else {
        // Admin or other
        setProfile({
          id: data.id,
          full_name: data.full_name || "Admin",
          email: data.email || "",
          profile_image: data.profile_image || null,
          role: auth.role
        });
      }
    } catch (e) {
      console.error("Profile fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimistic local update — no refetch needed after save
  const updateLocalProfile = useCallback(
    (updates: any) => {
      setProfile((prev: any) => prev ? { ...prev, ...updates } : prev);
    },
    []
  );

  // Auto-fetch on mount
  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, fetchProfile, updateLocalProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}

// Convenience selector for just the display name
export function useDisplayName(): string {
  const { profile } = useProfile();
  const auth = getAuth();
  if (profile?.full_name) return profile.full_name;
  if (auth?.role === 'admin') return 'Admin';
  return "User";
}
