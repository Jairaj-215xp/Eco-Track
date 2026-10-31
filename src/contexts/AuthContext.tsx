import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';

type Role = 'guest' | 'citizen' | 'org' | 'admin';
type UserRole = 'citizen' | 'org' | 'admin';

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  setRole: (role: Role) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role: 'citizen' | 'org') => Promise<{ error?: string }>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>('guest');
  const [loading, setLoading] = useState(true);

  // Restore session from Supabase or localStorage
  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userMeta = session.user.user_metadata || {};
            const userRole: UserRole = (userMeta.role as UserRole) || 'citizen';
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: userMeta.name || session.user.email?.split('@')[0] || 'User',
              role: userRole,
              orgId: userMeta.org_id
            });
            setRoleState(userRole);
          }
        } catch (e) {
          console.error('Error fetching Supabase session:', e);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const userMeta = session.user.user_metadata || {};
            const userRole: UserRole = (userMeta.role as UserRole) || 'citizen';
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: userMeta.name || session.user.email?.split('@')[0] || 'User',
              role: userRole,
              orgId: userMeta.org_id
            });
            setRoleState(userRole);
          } else {
            setUser(null);
            setRoleState('guest');
          }
        });

        setLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Fallback: check saved local auth
        const savedUser = localStorage.getItem('ecotrack_current_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setRoleState(parsed.role || 'guest');
          } catch (e) {
            console.error('Failed to parse saved user:', e);
          }
        }
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole === 'guest') {
      setUser(null);
      localStorage.removeItem('ecotrack_current_user');
    } else {
      const activeRole: UserRole = newRole as UserRole;
      const updatedUser: User = {
        id: user?.id || `user_${Date.now()}`,
        name: user?.name || (activeRole === 'org' ? 'Green Earth NGO' : 'Aarav Patel'),
        email: user?.email || `${activeRole}@ecotrack.org`,
        role: activeRole,
        orgId: activeRole === 'org' ? 'org_demo' : undefined
      };
      setUser(updatedUser);
      localStorage.setItem('ecotrack_current_user', JSON.stringify(updatedUser));
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const userMeta = data.user.user_metadata || {};
        const userRole: UserRole = (userMeta.role as UserRole) || (email.includes('org') ? 'org' : 'citizen');
        const loggedUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: userMeta.name || email.split('@')[0],
          role: userRole,
          orgId: userMeta.org_id
        };
        setUser(loggedUser);
        setRoleState(userRole);
        return {};
      }
    }

    // Local authentication fallback
    const inferredRole: UserRole = email.includes('org') ? 'org' : email.includes('admin') ? 'admin' : 'citizen';
    const mockUser: User = {
      id: `u_${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: inferredRole,
      orgId: inferredRole === 'org' ? 'org_local' : undefined
    };
    setUser(mockUser);
    setRoleState(inferredRole);
    localStorage.setItem('ecotrack_current_user', JSON.stringify(mockUser));
    return {};
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    signupRole: 'citizen' | 'org'
  ): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: signupRole
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email,
          name,
          role: signupRole
        };
        setUser(newUser);
        setRoleState(signupRole);
        return {};
      }
    }

    // Local signup fallback
    const newUser: User = {
      id: `u_${Date.now()}`,
      email,
      name,
      role: signupRole
    };
    setUser(newUser);
    setRoleState(signupRole);
    localStorage.setItem('ecotrack_current_user', JSON.stringify(newUser));
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
