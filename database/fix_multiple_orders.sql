-- Fix to allow enterprises to place multiple orders
-- This removes the unique constraint on industry_id if it exists

-- ============================================
-- STEP 1: Remove unique constraint on industry_id
-- ============================================

-- First, check if a unique constraint exists on industry_id
DO $$
BEGIN
    -- Drop any unique constraint on industry_id column
    ALTER TABLE public.industry_order 
    DROP CONSTRAINT IF EXISTS industry_order_industry_id_key;
    
    -- Also drop any other unique constraints that might exist
    ALTER TABLE public.industry_order 
    DROP CONSTRAINT IF EXISTS industry_order_industry_id_unique;
    
    -- Drop constraint if it was named with order_id
    ALTER TABLE public.industry_order 
    DROP CONSTRAINT IF EXISTS industry_order_order_id_industry_id_key;
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Constraint does not exist, skipping';
END $$;

-- ============================================
-- STEP 2: Add proper indexes for query performance
-- ============================================

-- Index for fetching orders by industry (enterprise viewing their orders)
CREATE INDEX IF NOT EXISTS idx_industry_order_industry_id 
ON public.industry_order(industry_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_industry_order_status 
ON public.industry_order(status);

-- Index for assigned dealer
CREATE INDEX IF NOT EXISTS idx_industry_order_assigned_dealer 
ON public.industry_order(assigned_dealer_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_industry_order_industry_status 
ON public.industry_order(industry_id, status);

-- ============================================
-- STEP 3: Ensure status column exists and has proper values
-- ============================================

-- Add status column if it doesn't exist
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Add assigned_dealer_id if not exists
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS assigned_dealer_id UUID REFERENCES users(user_id);

-- Add final_price to track negotiated price
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS final_price NUMERIC(10, 2);

-- Add counter_price to track dealer's counter offer
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS counter_price NUMERIC(10, 2);

-- Add enterprise_counter_price to track enterprise's counter
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS enterprise_counter_price NUMERIC(10, 2);

-- Add updated_at timestamp
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add fulfillment_notes
ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;

-- ============================================
-- STEP 4: Create function to update timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_industry_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_industry_order_updated_at ON public.industry_order;

-- Create trigger
CREATE TRIGGER update_industry_order_updated_at
    BEFORE UPDATE ON public.industry_order
    FOR EACH ROW
    EXECUTE FUNCTION update_industry_order_timestamp();

-- ============================================
-- STEP 5: Update existing orders to have status if null
-- ============================================

UPDATE public.industry_order 
SET status = 'pending' 
WHERE status IS NULL;

-- ============================================
-- STEP 6: Verify the fix
-- ============================================

-- Check current constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'industry_order'::regclass;
