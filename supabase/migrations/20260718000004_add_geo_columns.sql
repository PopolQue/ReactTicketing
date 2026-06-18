-- Add event_geometry to events
ALTER TABLE IF EXISTS "public"."events" ADD COLUMN IF NOT EXISTS "event_geometry" "jsonb" DEFAULT '{}'::"jsonb";

-- Add venue_geometry to venues
ALTER TABLE IF EXISTS "public"."venues" ADD COLUMN IF NOT EXISTS "venue_geometry" "jsonb" DEFAULT '{}'::"jsonb";
