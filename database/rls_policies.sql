-- Enable RLS policies for orders and order_items tables

-- Policy: Allow authenticated users to insert their own orders
CREATE POLICY "Allow authenticated users to insert orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (buyer_id = auth.uid());

-- Policy: Allow authenticated users to view their own orders
CREATE POLICY "Allow users to view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (buyer_id = auth.uid());

-- Policy: Allow users to update their own orders (for cancellations)
CREATE POLICY "Allow users to update their own orders" 
ON public.orders 
FOR UPDATE 
TO authenticated 
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- Policy: Allow authenticated users to insert order items
CREATE POLICY "Allow authenticated users to insert order items" 
ON public.order_items 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Allow users to view order items for their orders
CREATE POLICY "Allow users to view their order items" 
ON public.order_items 
FOR SELECT 
TO authenticated 
USING (
    order_id IN (
        SELECT order_id FROM public.orders WHERE buyer_id = auth.uid()
    )
);
