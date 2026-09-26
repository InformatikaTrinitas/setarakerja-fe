import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSessionUser } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  title: string;
  avatar: string; // base64 data URL or empty string
}

export interface UserContextValue {
  profile: UserProfile;
  updateProfile: (partial: Partial<UserProfile>) => void;
}

const STORAGE_KEY = 'user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Pengguna',
  title: 'Software Engineer',
  avatar: '',
};

function loadProfile(): UserProfile {
  let stored: Partial<UserProfile> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as Partial<UserProfile>;
  } catch {
    stored = {};
  }

  const merged: UserProfile = { ...DEFAULT_PROFILE, ...stored };

  // Data dari backend (login) menjadi sumber utama bila tersedia.
  const session = getSessionUser();
  if (session) {
    merged.name = session.name || merged.name;
    merged.title = session.title || merged.title;
    if (session.avatar) merged.avatar = session.avatar;
  }

  return merged;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextValue | null>(null);

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode;
  /** Optional initial role — affects the default title shown before profile is loaded */
  initialRole?: 'kandidat' | 'hrd' | null;
}

export function UserProvider({ children, initialRole }: ProviderProps) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const loaded = loadProfile();
    // Seed sensible defaults based on role if the profile is still at the generic default
    if (loaded.name === DEFAULT_PROFILE.name && initialRole) {
      return {
        ...loaded,
        name: initialRole === 'hrd' ? 'HR Manager' : 'Kandidat',
        title: initialRole === 'hrd' ? 'Admin Officer' : 'Software Engineer',
      };
    }
    return loaded;
  });

  // Sync to localStorage whenever profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [profile]);

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...partial }));
  }, []);

  return (
    <UserContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}
