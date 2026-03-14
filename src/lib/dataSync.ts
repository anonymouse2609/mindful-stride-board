import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Utility function to sync localStorage changes to Supabase
export const syncToSupabase = async (key: string, value: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Skip auth-related keys
    if (key.startsWith('sb-') && key.includes('auth-token')) return;

    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: user.id,
        data_key: key,
        data_value: value,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`Error syncing ${key} to Supabase:`, error);
    }
  } catch (error) {
    console.error('Error in syncToSupabase:', error);
  }
};

// Enhanced localStorage setItem that also syncs to Supabase
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key: string, value: string) {
  originalSetItem.call(this, key, value);

  // Try to parse the value for syncing
  let parsedValue: any = value;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    // Keep as string if not JSON
  }

  syncToSupabase(key, parsedValue);
};

// Enhanced localStorage removeItem that also removes from Supabase
const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key: string) {
  originalRemoveItem.call(this, key);

  // Remove from Supabase
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (user) {
      await supabase
        .from('user_data')
        .delete()
        .eq('user_id', user.id)
        .eq('data_key', key);
    }
  }).catch(error => {
    console.error('Error removing from Supabase:', error);
  });
};

// Enhanced localStorage clear that also clears from Supabase
const originalClear = localStorage.clear;
localStorage.clear = function() {
  originalClear.call(this);

  // Clear from Supabase (but keep theme)
  supabase.auth.getUser().then(async ({ data: { user } }) => {
    if (user) {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', user.id)
        .neq('data_key', 'growth-theme'); // Keep theme

      if (error) {
        console.error('Error clearing data from Supabase:', error);
      }
    }
  }).catch(error => {
    console.error('Error clearing from Supabase:', error);
  });
};