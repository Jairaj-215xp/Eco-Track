import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';
import { reportService } from '../services/reportService';

type Role = 'guest' | 'citizen' | 'org' | 'admin';
type UserRole = 'citizen' | 'org' | 'admin';

export interface SignUpExtraData {
  orgServiceArea?: string;
  orgCoords?: { lat: number; lng: number };
  orgType?: 'ngo' | 'municipal';
  crewSize?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  setRole: (role: Role) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string, 
    password: string, 
    name: string, 
    role: 'citizen' | 'org' | 'admin',
    extraData?: SignUpExtraData
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'guest',
  loading: true,
  setRole: () => {},
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {}
});

const USERS_STORAGE_KEY = 'ecotrack_registered_accounts_v1';

export interface RegisteredAccount {
  user: User;
  password?: string;
}

const DEFAULT_ACCOUNTS: RegisteredAccount[] = [
  {
    user: {
      id: 'user_admin_default',
      name: 'Municipal Solid Waste Admin',
      email: 'admin@ecotrack.org',
      role: 'admin'
    },
    password: 'admin'
  },
  {
    user: {
      id: 'user_ngo_green_earth',
      name: 'Green Earth Foundation',
      email: 'ops@greenearth.org',
      role: 'org',
      orgId: 'org_green_earth',
      orgServiceArea: 'Central Pune & Deccan Gymkhana',
      orgCoords: { lat: 18.5167, lng: 73.8417 },
      orgType: 'ngo',
      crewSize: '10-30 active members',
      phone: '+91 98220 11223'
    },
    password: 'ngo'
  },
  {
    user: {
      id: 'user_citizen_aarav',
      name: 'Aarav Patel',
      email: 'citizen@ecotrack.org',
      role: 'citizen'
    },
    password: 'citizen'
  }
];

function getRegisteredAccounts(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading registered accounts:', e);
  }
  return DEFAULT_ACCOUNTS;
}

function saveRegisteredAccount(account: RegisteredAccount) {
  try {
    const existing = getRegisteredAccounts();
    const updated = existing.filter(a => a.user.email?.toLowerCase() !== account.user.email?.toLowerCase());
    updated.unshift(account);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving registered account:', e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUserStr = localStorage.getItem('ecotrack_current_user');
      if (savedUserStr) {
        return JSON.parse(savedUserStr);
      }
    } catch (e) {
      console.error('Failed to parse initial user from localStorage:', e);
    }
    return null;
  });

  const [role, setRoleState] = useState<Role>(() => {
    try {
      const savedUserStr = localStorage.getItem('ecotrack_current_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.role) return parsed.role;
      }
    } catch (e) {
      console.error('Failed to parse initial role from localStorage:', e);
    }
    return 'guest';
  });

  const [loading, setLoading] = useState(true);

  // Restore session reliably: checks localStorage immediately so reload never resets auth state
  useEffect(() => {
    async function initAuth() {
      // 1. Immediately re-validate from local storage cache so reload NEVER logs out
      const savedUserStr = localStorage.getItem('ecotrack_current_user');
      if (savedUserStr) {
        try {
          const parsed: User = JSON.parse(savedUserStr);
          if (parsed && parsed.role) {
            setUser(parsed);
            setRoleState(parsed.role);
          }
        } catch (e) {
          console.error('Failed to parse saved user:', e);
        }
      }

      // 2. Sync with Supabase session if configured
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userMeta = session.user.user_metadata || {};
            const userRole: UserRole = (userMeta.role as UserRole) || 'citizen';
            const authUser: User = {
              id: session.user.id,
              email: session.user.email,
              name: userMeta.name || session.user.email?.split('@')[0] || 'User',
              role: userRole,
              orgId: userMeta.org_id,
              orgServiceArea: userMeta.org_service_area,
              orgCoords: userMeta.org_coords,
              orgType: userMeta.org_type,
              crewSize: userMeta.crew_size,
              phone: userMeta.phone
            };
            setUser(authUser);
            setRoleState(userRole);
            localStorage.setItem('ecotrack_current_user', JSON.stringify(authUser));
          }
        } catch (e) {
          console.error('Error fetching Supabase session:', e);
        }

        // Listen for auth state changes - ONLY sign out if explicitly SIGNED_OUT
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            const userMeta = session.user.user_metadata || {};
            const userRole: UserRole = (userMeta.role as UserRole) || 'citizen';
            const authUser: User = {
              id: session.user.id,
              email: session.user.email,
              name: userMeta.name || session.user.email?.split('@')[0] || 'User',
              role: userRole,
              orgId: userMeta.org_id,
              orgServiceArea: userMeta.org_service_area,
              orgCoords: userMeta.org_coords,
              orgType: userMeta.org_type,
              crewSize: userMeta.crew_size,
              phone: userMeta.phone
            };
            setUser(authUser);
            setRoleState(userRole);
            localStorage.setItem('ecotrack_current_user', JSON.stringify(authUser));
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setRoleState('guest');
            localStorage.removeItem('ecotrack_current_user');
          }
        });

        setLoading(false);
        return () => subscription.unsubscribe();
      }

      setLoading(false);
    }

    initAuth();
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole === 'guest') {
      setUser(null);
      localStorage.removeItem('ecotrack_current_user');
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!error && data?.user) {
          const userMeta = data.user.user_metadata || {};
          const userRole: UserRole = (userMeta.role as UserRole) || (cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('org') ? 'org' : 'citizen');
          const loggedUser: User = {
            id: data.user.id,
            email: data.user.email,
            name: userMeta.name || cleanEmail.split('@')[0],
            role: userRole,
            orgId: userMeta.org_id,
            orgServiceArea: userMeta.org_service_area,
            orgCoords: userMeta.org_coords,
            orgType: userMeta.org_type,
            crewSize: userMeta.crew_size,
            phone: userMeta.phone
          };
          setUser(loggedUser);
          setRoleState(userRole);
          localStorage.setItem('ecotrack_current_user', JSON.stringify(loggedUser));
          saveRegisteredAccount({ user: loggedUser, password });
          return {};
        }

        if (error) {
          return { error: error.message };
        }
      } catch (err: any) {
        console.warn('Supabase auth notice:', err);
      }
    }

    // Local / Registered accounts lookup
    const allAccounts = getRegisteredAccounts();
    const found = allAccounts.find(a => a.user.email?.toLowerCase() === cleanEmail);

    if (!found) {
      return { error: 'No account registered with this email. Please check your email or click "Sign up" to create an account.' };
    }

    if (found.password && password && found.password !== password) {
      return { error: 'Incorrect password. Please verify your credentials.' };
    }

    setUser(found.user);
    setRoleState(found.user.role);
    localStorage.setItem('ecotrack_current_user', JSON.stringify(found.user));
    return {};
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    signupRole: 'citizen' | 'org' | 'admin',
    extraData?: SignUpExtraData
  ): Promise<{ error?: string }> => {
    // Generate distinct, clean org ID for any new NGO registration
    let assignedOrgId: string | undefined = undefined;
    if (signupRole === 'org') {
      const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').substring(0, 20);
      assignedOrgId = `org_${cleanSlug}_${Date.now().toString(36)}`;

      // Register the new NGO in the directory
      await reportService.registerOrganisation({
        id: assignedOrgId,
        name,
        type: extraData?.orgType || 'ngo',
        serviceArea: extraData?.orgServiceArea || 'Citywide Operating Base',
        coords: extraData?.orgCoords,
        approved: true,
        contactEmail: email,
        phone: extraData?.phone,
        crewSize: extraData?.crewSize
      });
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: signupRole,
              org_id: assignedOrgId,
              org_service_area: extraData?.orgServiceArea,
              org_coords: extraData?.orgCoords,
              org_type: extraData?.orgType,
              crew_size: extraData?.crewSize,
              phone: extraData?.phone
            }
          }
        });

        if (!error && data?.user) {
          const newUser: User = {
            id: data.user.id,
            email: data.user.email,
            name,
            role: signupRole,
            orgId: assignedOrgId,
            orgServiceArea: extraData?.orgServiceArea,
            orgCoords: extraData?.orgCoords,
            orgType: extraData?.orgType,
            crewSize: extraData?.crewSize,
            phone: extraData?.phone
          };
          setUser(newUser);
          setRoleState(signupRole);
          localStorage.setItem('ecotrack_current_user', JSON.stringify(newUser));
          saveRegisteredAccount({ user: newUser, password });
          return {};
        }

        if (error) {
          const msg = error.message.toLowerCase();
          // If Supabase's shared SMTP rate limit is exceeded or throttled,
          // gracefully fallback to local account registration so the user is never locked out of testing/using the app!
          if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
            console.warn('Supabase email rate limit exceeded on shared SMTP. Falling back to local account registration:', error.message);
            // Fall through to local registration below
          } else {
            return { error: error.message };
          }
        }
      } catch (err: any) {
        console.warn('Supabase signUp notice, falling back to local account:', err);
      }
    }

    // Local signup fallback
    const newUser: User = {
      id: `u_${Date.now()}`,
      email,
      name,
      role: signupRole,
      orgId: assignedOrgId,
      orgServiceArea: extraData?.orgServiceArea,
      orgCoords: extraData?.orgCoords,
      orgType: extraData?.orgType,
      crewSize: extraData?.crewSize,
      phone: extraData?.phone
    };
    setUser(newUser);
    setRoleState(signupRole);
    localStorage.setItem('ecotrack_current_user', JSON.stringify(newUser));
    saveRegisteredAccount({ user: newUser, password });
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setRoleState('guest');
    localStorage.removeItem('ecotrack_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, setRole, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
