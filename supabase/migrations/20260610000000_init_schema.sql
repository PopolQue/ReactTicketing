-- Create ticket_types table
CREATE TABLE IF NOT EXISTS ticket_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    pricing JSONB NOT NULL,
    capacity INTEGER,
    max_per_order INTEGER,
    sale_start_date TIMESTAMP WITH TIME ZONE,
    sale_end_date TIMESTAMP WITH TIME ZONE,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    transferable BOOLEAN NOT NULL DEFAULT true,
    visible BOOLEAN NOT NULL DEFAULT true,
    archived BOOLEAN NOT NULL DEFAULT false,
    event_id TEXT NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    items JSONB NOT NULL,
    buyer_email TEXT NOT NULL,
    promo_code TEXT,
    subtotal_cents INTEGER NOT NULL,
    discount_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    ticket_type_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    personalization JSONB NOT NULL,
    buyer_email TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'valid',
    qr_payload TEXT NOT NULL,
    price_paid_cents INTEGER NOT NULL
);

-- Create scan_events table
CREATE TABLE IF NOT EXISTS scan_events (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scanned_by_account_id TEXT NOT NULL,
    scanned_by_account_name TEXT NOT NULL,
    result TEXT NOT NULL,
    payload TEXT
);

-- Create scan_accounts table
CREATE TABLE IF NOT EXISTS scan_accounts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    username TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    pin_salt TEXT NOT NULL,
    credential_version INTEGER NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_admin BOOLEAN NOT NULL DEFAULT true,
    assigned_location TEXT
);
