
-- CURATED WITH CARE BY M.
-- Initial order database structure

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_number TEXT UNIQUE NOT NULL,

    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,

    items JSONB NOT NULL DEFAULT '[]'::jsonb,

    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    delivery NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,

    currency TEXT NOT NULL DEFAULT 'EUR',

    payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            payment_status IN (
                'pending',
                'paid',
                'failed',
                'refunded'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable database-level row security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- No public customer access policies are created.
-- Orders will be accessed through a secure backend.
