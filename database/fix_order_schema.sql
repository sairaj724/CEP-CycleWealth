-- Fix industry_order schema to allow multiple orders per enterprise
-- and add order history tracking

-- ============================================
-- STEP 1: Remove unique constraint on industry_id
-- ============================================

ALTER TABLE public.industry_order 
DROP CONSTRAINT IF EXISTS industry_order_industry_id_key;

-- ============================================
-- STEP 2: Add order_number for tracking
-- ============================================

ALTER TABLE public.industry_order 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

-- ============================================
-- STEP 3: Add more status options
-- ============================================

-- Status can be: pending, accepted, rejected, countered, fulfilled, cancelled, completed

-- ============================================
-- STEP 4: Create order history table for archiving
-- ============================================

CREATE TABLE IF NOT EXISTS public.industry_order_history (
    history_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    industry_id UUID NOT NULL,
    order_number VARCHAR(50),
    material_type TEXT,
    quantity NUMERIC(9, 2),
    price NUMERIC(9, 4),
    final_price NUMERIC(9, 4),
    delivery_details TEXT,
    "City" TEXT,
    "PIN_code" TEXT,
    "Prefered_Delivery_Date" DATE,
    "Person_name" TEXT,
    phone_no VARCHAR,
    status VARCHAR(50),
    assigned_dealer_id UUID,
    dealer_name TEXT,
    fulfillment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order history
CREATE INDEX IF NOT EXISTS idx_order_history_industry_id ON public.industry_order_history(industry_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON public.industry_order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_status ON public.industry_order_history(status);

-- Enable RLS on history table
ALTER TABLE public.industry_order_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own order history
CREATE POLICY "Users can view own order history"
ON public.industry_order_history FOR SELECT
USING (auth.uid() = industry_id);

-- ============================================
-- STEP 5: Create function to archive completed orders
-- ============================================

CREATE OR REPLACE FUNCTION archive_completed_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Archive order when status changes to fulfilled or completed
    IF NEW.status IN ('fulfilled', 'completed', 'cancelled') AND OLD.status NOT IN ('fulfilled', 'completed', 'cancelled') THEN
        INSERT INTO public.industry_order_history (
            order_id, industry_id, order_number, material_type, quantity,
            price, final_price, delivery_details, "City", "PIN_code",
            "Prefered_Delivery_Date", "Person_name", phone_no, status,
            assigned_dealer_id, fulfillment_notes, created_at, accepted_at,
            fulfilled_at, completed_at
        )
        SELECT 
            o.order_id, o.industry_id, o.order_number, o.material_type, o.quantity,
            o.price, o.final_price, o.delivery_details, o."City", o."PIN_code",
            o."Prefered_Delivery_Date", o."Person_name", o.phone_no, o.status,
            o.assigned_dealer_id, o.fulfillment_notes, o.created_at, 
            o.updated_at as accepted_at,
            CASE WHEN o.status = 'fulfilled' THEN o.updated_at END as fulfilled_at,
            NOW() as completed_at
        FROM public.industry_order o
        WHERE o.order_id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_archive_completed_order ON public.industry_order;

-- Create trigger
CREATE TRIGGER trigger_archive_completed_order
    AFTER UPDATE ON public.industry_order
    FOR EACH ROW
    EXECUTE FUNCTION archive_completed_order();

-- ============================================
-- STEP 6: Create function to generate order numbers
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    year_str VARCHAR(2);
BEGIN
    -- Get count of orders for this industry this year + 1
    SELECT COUNT(*) + 1 INTO next_num
    FROM public.industry_order
    WHERE industry_id = NEW.industry_id
    AND EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW())) = EXTRACT(YEAR FROM NOW());
    
    -- Format: ORD-YY-XXXX (e.g., ORD-25-0001)
    year_str := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
    NEW.order_number := 'ORD-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_generate_order_number ON public.industry_order;

-- Create trigger
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON public.industry_order
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- ============================================
-- STEP 7: Add RLS policies for current orders
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable select for industry owners" ON public.industry_order;
DROP POLICY IF EXISTS "Enable insert for industry owners" ON public.industry_order;
DROP POLICY IF EXISTS "Enable update for industry owners" ON public.industry_order;
DROP POLICY IF EXISTS "Enable select for scrap dealers" ON public.industry_order;
DROP POLICY IF EXISTS "Enable update for assigned dealers" ON public.industry_order;

-- Policy: Industries can view their own orders
CREATE POLICY "Industries can view own orders"
ON public.industry_order FOR SELECT
USING (auth.uid() = industry_id);

-- Policy: Industries can insert their own orders
CREATE POLICY "Industries can insert own orders"
ON public.industry_order FOR INSERT
WITH CHECK (auth.uid() = industry_id);

-- Policy: Industries can update their own orders
CREATE POLICY "Industries can update own orders"
ON public.industry_order FOR UPDATE
USING (auth.uid() = industry_id)
WITH CHECK (auth.uid() = industry_id);

-- Policy: Scrap dealers can view pending orders
CREATE POLICY "Dealers can view pending orders"
ON public.industry_order FOR SELECT
USING (status = 'pending');

-- Policy: Scrap dealers can update orders they're assigned to
CREATE POLICY "Dealers can update assigned orders"
ON public.industry_order FOR UPDATE
USING (assigned_dealer_id = auth.uid());

-- ============================================
-- STEP 8: Grant permissions
-- ============================================

GRANT ALL ON public.industry_order TO authenticated;
GRANT ALL ON public.industry_order_history TO authenticated;

-- ============================================
-- STEP 9: Verify changes
-- ============================================

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'industry_order'::regclass;
