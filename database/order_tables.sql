-- Create customer_orders table
CREATE TABLE IF NOT EXISTS public.customer_orders (
    order_id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NULL,
    total_amount numeric(10, 2) NULL,
    status character varying(50) NULL DEFAULT 'Pending',
    delivery_name character varying(100) NULL,
    delivery_phone character varying(20) NULL,
    delivery_street text NULL,
    delivery_city character varying(50) NULL,
    delivery_state character varying(50) NULL,
    delivery_pin_code character varying(10) NULL,
    delivery_landmark character varying(100) NULL,
    payment_method character varying(20) NULL DEFAULT 'COD',
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now()
) TABLESPACE pg_default;

-- Enable RLS on customer_orders
ALTER TABLE IF EXISTS public.customer_orders ENABLE ROW LEVEL SECURITY;

-- Create order_items table (updated schema with quantity and unit_price)
CREATE TABLE IF NOT EXISTS public.order_items (
    order_item_id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NULL,
    product_id uuid NULL,
    labor_id uuid NULL,
    quantity integer NULL DEFAULT 1,
    unit_price numeric(10, 2) NULL,
    price_at_purchase numeric(10, 2) NULL,
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) 
        REFERENCES public.customer_orders (order_id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) 
        REFERENCES public.upcycled_products (product_id)
) TABLESPACE pg_default;

-- Enable RLS on order_items
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_id 
    ON public.customer_orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
    ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
    ON public.order_items (product_id);
