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