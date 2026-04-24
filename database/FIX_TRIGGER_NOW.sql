-- EMERGENCY FIX - Run this in Supabase SQL Editor NOW
-- This fixes the trigger error by adding created_at column

-- Add created_at column (matches your schema style)
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'industry_order';
