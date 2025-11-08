-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create mind_maps table
CREATE TABLE IF NOT EXISTS public.mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  interest_area TEXT,
  skill_level TEXT,
  map_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;

-- Mind maps policies
CREATE POLICY "Users can view their own mind maps"
  ON public.mind_maps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mind maps"
  ON public.mind_maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mind maps"
  ON public.mind_maps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mind maps"
  ON public.mind_maps FOR DELETE
  USING (auth.uid() = user_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mind_maps_updated_at
  BEFORE UPDATE ON public.mind_maps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();