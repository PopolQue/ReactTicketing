-- 1. Create Organizer Profiles
CREATE TABLE IF NOT EXISTS organizer_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_name TEXT NOT NULL,
  stripe_account_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Alter Events to link to Organizers
ALTER TABLE events ADD COLUMN organizer_id UUID REFERENCES organizer_profiles(id);

-- 3. Alter Tickets to link to Fans (owner)
ALTER TABLE tickets ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- 4. Create Resale Listings
CREATE TABLE IF NOT EXISTS resale_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT REFERENCES tickets(id) UNIQUE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  asking_price_cents INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS and Add Policies
ALTER TABLE organizer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers manage own profile" ON organizer_profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Organizers manage own events" ON events FOR ALL USING (auth.uid() = organizer_id);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fans view own tickets" ON tickets FOR SELECT USING (auth.uid() = owner_id);

ALTER TABLE resale_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public views active resales" ON resale_listings FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers manage own listings" ON resale_listings FOR ALL USING (auth.uid() = seller_id);
