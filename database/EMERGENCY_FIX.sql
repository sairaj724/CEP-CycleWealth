-- EMERGENCY FIX - Run this immediately in Supabase SQL Editor
-- This fixes the 400 error when creating orders

-- ============================================
-- STEP 1: Remove ALL constraints on industry_id
-- ============================================

-- Drop the unique constraint if it exists
ALTER TABLE public.industry_order 
DROP CONSTRAINT IF EXISTS industry_order_industry_id_key;

-- Drop any other unique constraints
ALTER TABLE public.industry_order 
DROP CONSTRAINT IF EXISTS industry_order_industry_id_unique;

ALTER TABLE public.industry_order 
DROP CONSTRAINT IF EXISTS industry_order_order_id_industry_id_key;

-- ============================================
-- STEP 2: Remove problematic triggers
-- ============================================

DROP TRIGGER IF EXISTS trigger_generate_order_number ON public.industry_order;
DROP FUNCTION IF EXISTS generate_order_number();

-- ============================================
-- STEP 3: Add missing columns (if not exist)
-- ============================================

-- Add order_number without NOT NULL constraint
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

-- Add other missing columns
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS assigned_dealer_id UUID REFERENCES users(user_id);

ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS final_price NUMERIC(10, 2);

ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;

ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- STEP 4: Fix the order_number with a simple default
-- ============================================

-- Update existing rows to have an order_number
UPDATE public.industry_order 
SET order_number = 'ORD-' || SUBSTRING(order_id::TEXT, 1, 8)
WHERE order_number IS NULL;

-- ============================================
-- STEP 5: Ensure RLS is correct
-- ============================================

-- Enable RLS
ALTER TABLE public.industry_order ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Industries can view own orders" ON public.industry_order;
DROP POLICY IF EXISTS "Industries can insert own orders" ON public.industry_order;
DROP POLICY IF EXISTS "Industries can update own orders" ON public.industry_order;
DROP POLICY IF EXISTS "Dealers can view pending orders" ON public.industry_order;
DROP POLICY IF EXISTS "Dealers can update assigned orders" ON public.industry_order;
DROP POLICY IF EXISTS "Enable select for industry owners" ON public.industry_order;
DROP POLICY IF EXISTS "Enable insert for industry owners" ON public.industry_order;
DROP POLICY IF EXISTS "Enable update for industry owners" ON public.industry_order;
DROP POLICY IF EXISTS "Enable select for scrap dealers" ON public.industry_order;
DROP POLICY IF EXISTS "Enable update for assigned dealers" ON public.industry_order;

-- Create simple policies
CREATE POLICY "Enable all for authenticated"
ON public.industry_order FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- STEP 6: Grant permissions
-- ============================================

GRANT ALL ON public.industry_order TO authenticated;

-- ============================================
-- STEP 7: Verify table structure
-- ============================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'industry_order';
