# Supabase Authentication Setup

This app now includes complete Supabase authentication with data synchronization. Follow these steps to set it up:

## 1. Database Setup

Run the SQL script in `supabase/user_data_table.sql` in your Supabase SQL editor to create the required table:

```sql
-- Create the user_data table for storing user localStorage data
CREATE TABLE IF NOT EXISTS public.user_data (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_key TEXT NOT NULL,
    data_value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id, data_key)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own data
CREATE POLICY "Users can only access their own data" ON public.user_data
    FOR ALL USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS user_data_user_id_idx ON public.user_data(user_id);
CREATE INDEX IF NOT EXISTS user_data_updated_at_idx ON public.user_data(updated_at);

-- Grant necessary permissions
GRANT ALL ON public.user_data TO authenticated;
GRANT ALL ON public.user_data TO service_role;
```

## 2. Authentication Configuration

The app is already configured to use the Supabase credentials from your `.env` file:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Make sure these are set correctly in your Supabase project.

## 3. Features Implemented

### Authentication
- ✅ Email/password signup and login
- ✅ Session persistence across browser sessions
- ✅ Automatic logout on session expiry
- ✅ Protected routes (main app only accessible when logged in)

### Data Synchronization
- ✅ Automatic sync of all localStorage data to Supabase on login
- ✅ Real-time sync of localStorage changes to Supabase
- ✅ Data restoration from Supabase on login (cross-device sync)
- ✅ Secure data isolation (users only see their own data)

### User Interface
- ✅ Login/signup page with tabs
- ✅ User email displayed in Settings profile section
- ✅ Logout button in Settings
- ✅ Loading states and error handling
- ✅ Toast notifications for auth actions

## 4. How It Works

1. **First Visit**: Users see the Auth page and can sign up or log in
2. **After Login**: All existing localStorage data is synced to Supabase
3. **Data Changes**: Any localStorage updates are automatically synced to Supabase
4. **Cross-Device**: When logging in on another device, data is restored from Supabase
5. **Logout**: Clears session and shows Auth page again

## 5. Security

- Row Level Security (RLS) ensures users can only access their own data
- Authentication tokens are handled securely by Supabase
- Data is encrypted in transit and at rest
- No sensitive data is stored in localStorage (only user preferences and app state)

## 6. Testing

To test the authentication:

1. Sign up with a new email
2. Check your email for verification (if email confirmation is enabled in Supabase)
3. Log in and verify data sync
4. Make some changes in the app
5. Log out and log back in to verify data persistence
6. Try logging in from an incognito window to test cross-session sync