import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  syncDataToSupabase: () => Promise<void>;
  loadDataFromSupabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        loadDataFromSupabase();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        await loadDataFromSupabase();
        await syncDataToSupabase();
        toast({ title: "Welcome back! 🎉" });
      } else if (event === 'SIGNED_OUT') {
        toast({ title: "Logged out successfully" });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error) {
      toast({ title: "Account created! Please check your email to verify your account." });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error signing out", description: error.message, variant: "destructive" });
    }
  };

  const syncDataToSupabase = async () => {
    if (!user) return;

    try {
      // Get all localStorage data
      const dataToSync: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== 'sb-oihvcltlgwpdmsurorxn-auth-token') { // Skip auth token
          try {
            dataToSync[key] = JSON.parse(localStorage.getItem(key)!);
          } catch {
            dataToSync[key] = localStorage.getItem(key);
          }
        }
      }

      // Sync each key to Supabase
      const syncPromises = Object.entries(dataToSync).map(async ([key, value]) => {
        const { error } = await supabase
          .from('user_data')
          .upsert({
            user_id: user.id,
            data_key: key,
            data_value: value,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error(`Error syncing ${key}:`, error);
        }
      });

      await Promise.all(syncPromises);
    } catch (error) {
      console.error('Error syncing data to Supabase:', error);
    }
  };

  const loadDataFromSupabase = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data_key, data_value')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading data from Supabase:', error);
        return;
      }

      // Restore data to localStorage
      data.forEach(({ data_key, data_value }) => {
        try {
          localStorage.setItem(data_key, typeof data_value === 'string' ? data_value : JSON.stringify(data_value));
        } catch (error) {
          console.error(`Error restoring ${data_key}:`, error);
        }
      });

      // Trigger a page reload to apply the restored data
      window.location.reload();
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    syncDataToSupabase,
    loadDataFromSupabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};