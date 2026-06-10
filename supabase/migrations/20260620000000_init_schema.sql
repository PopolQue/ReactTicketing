-- Create timezones table
CREATE TABLE IF NOT EXISTS timezones (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL UNIQUE,
    iana_zone TEXT NOT NULL
);

-- Seed some standard timezones
INSERT INTO timezones (id, label, iana_zone) VALUES 
('gmt0_london', 'GMT+0 London', 'Europe/London'),
('gmt1_berlin', 'GMT+1 Berlin', 'Europe/Berlin'),
('gmt2_istanbul', 'GMT+2 Istanbul', 'Europe/Istanbul')
ON CONFLICT (id) DO NOTHING;

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organizer_name TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone_id TEXT NOT NULL REFERENCES timezones(id)
);

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
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
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
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
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
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scanned_by_account_id TEXT NOT NULL,
    scanned_by_account_name TEXT NOT NULL,
    result TEXT NOT NULL,
    payload TEXT
);

-- Create scan_accounts table
CREATE TABLE IF NOT EXISTS scan_accounts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    pin_salt TEXT NOT NULL,
    credential_version INTEGER NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_admin BOOLEAN NOT NULL DEFAULT true,
    assigned_location TEXT
);
