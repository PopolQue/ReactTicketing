


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "private"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_ticket_id TEXT;
    v_seller_id UUID;
    v_is_active BOOLEAN;
BEGIN
    SELECT ticket_id, seller_id, is_active 
    INTO v_ticket_id, v_seller_id, v_is_active
    FROM resale_listings 
    WHERE id = p_listing_id 
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_active THEN
        RAISE EXCEPTION 'Listing is no longer active or does not exist';
    END IF;

    UPDATE resale_listings SET is_active = FALSE WHERE id = p_listing_id;
    UPDATE tickets SET owner_id = p_buyer_id WHERE id = v_ticket_id;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "private"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."promote_admin_by_email"("target_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  target_user_id UUID;
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin';
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Only superadmins can promote users.';
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email LIMIT 1;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found.', target_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$;


ALTER FUNCTION "private"."promote_admin_by_email"("target_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF p_buyer_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot purchase ticket on behalf of another user';
    END IF;
    RETURN private.buy_resale_ticket(p_listing_id, p_buyer_id);
END;
$$;


ALTER FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_admin_by_email"("target_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN private.promote_admin_by_email(target_email);
END;
$$;


ALTER FUNCTION "public"."promote_admin_by_email"("target_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."artists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "image_url" "text",
    "spotify_url" "text",
    "instagram_url" "text",
    "soundcloud_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blogs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text" NOT NULL,
    "excerpt" "text",
    "cover_image_url" "text",
    "published" boolean DEFAULT false,
    "author_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blogs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_artists" (
    "event_id" "text" NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "performance_time" timestamp with time zone,
    "stage_name" "text"
);


ALTER TABLE "public"."event_artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "organizer_name" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "timezone_id" "text" NOT NULL,
    "organizer_id" "uuid",
    "description" "text",
    "venue" "text",
    "published" boolean DEFAULT false,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "theme_customization" "jsonb" DEFAULT '{}'::"jsonb",
    "country" "text",
    "city" "text",
    "is_external" boolean DEFAULT false,
    "external_ticket_url" "text",
    "approval_status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    CONSTRAINT "events_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "items" "jsonb" NOT NULL,
    "buyer_email" "text" NOT NULL,
    "promo_code" "text",
    "subtotal_cents" integer NOT NULL,
    "discount_cents" integer NOT NULL,
    "total_cents" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizer_profiles" (
    "id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "stripe_account_id" "text",
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "subscription_tier" "text" DEFAULT 'free'::"text"
);


ALTER TABLE "public"."organizer_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resale_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "text" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "asking_price_cents" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resale_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scan_accounts" (
    "id" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "username" "text" NOT NULL,
    "pin_hash" "text" NOT NULL,
    "pin_salt" "text" NOT NULL,
    "credential_version" integer DEFAULT 1 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by_admin" boolean DEFAULT true NOT NULL,
    "assigned_location" "text"
);


ALTER TABLE "public"."scan_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scan_events" (
    "id" "text" NOT NULL,
    "ticket_id" "text" NOT NULL,
    "scanned_at" timestamp with time zone DEFAULT "now"(),
    "scanned_by_account_id" "text" NOT NULL,
    "scanned_by_account_name" "text" NOT NULL,
    "result" "text" NOT NULL,
    "payload" "text"
);


ALTER TABLE "public"."scan_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_ticket_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "assigned_admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "pricing" "jsonb" NOT NULL,
    "capacity" integer,
    "max_per_order" integer,
    "sale_start_date" timestamp with time zone,
    "sale_end_date" timestamp with time zone,
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "transferable" boolean DEFAULT true NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "archived" boolean DEFAULT false NOT NULL,
    "event_id" "text" NOT NULL
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "text" NOT NULL,
    "event_id" "text" NOT NULL,
    "ticket_type_id" "text" NOT NULL,
    "order_id" "text" NOT NULL,
    "personalization" "jsonb" NOT NULL,
    "buyer_email" "text" NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "status" "text" DEFAULT 'pending_delivery'::"text" NOT NULL,
    "qr_payload" "text",
    "price_paid_cents" integer NOT NULL,
    "transfer_history" "jsonb" DEFAULT '[]'::"jsonb",
    "owner_id" "uuid"
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timezones" (
    "id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "iana_zone" "text" NOT NULL
);


ALTER TABLE "public"."timezones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."event_artists"
    ADD CONSTRAINT "event_artists_pkey" PRIMARY KEY ("event_id", "artist_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizer_profiles"
    ADD CONSTRAINT "organizer_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_ticket_id_key" UNIQUE ("ticket_id");



ALTER TABLE ONLY "public"."scan_accounts"
    ADD CONSTRAINT "scan_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scan_events"
    ADD CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timezones"
    ADD CONSTRAINT "timezones_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."timezones"
    ADD CONSTRAINT "timezones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."artists"
    ADD CONSTRAINT "artists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."organizer_profiles"("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."organizer_profiles"("id");



ALTER TABLE ONLY "public"."event_artists"
    ADD CONSTRAINT "event_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_artists"
    ADD CONSTRAINT "event_artists_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizer_profiles"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_timezone_id_fkey" FOREIGN KEY ("timezone_id") REFERENCES "public"."timezones"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizer_profiles"
    ADD CONSTRAINT "organizer_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."resale_listings"
    ADD CONSTRAINT "resale_listings_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE ONLY "public"."scan_accounts"
    ADD CONSTRAINT "scan_accounts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scan_events"
    ADD CONSTRAINT "scan_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all events" ON "public"."events" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins can read roles" ON "public"."user_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "user_roles_1"
  WHERE (("user_roles_1"."user_id" = "auth"."uid"()) AND ("user_roles_1"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Admins manage tickets" ON "public"."support_tickets" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Anyone can create tickets" ON "public"."support_tickets" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "Fans insert own tickets" ON "public"."tickets" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Fans view own tickets" ON "public"."tickets" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Organizers can view scan events" ON "public"."scan_events" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("public"."tickets" "t"
     JOIN "public"."events" "e" ON (("t"."event_id" = "e"."id")))
  WHERE (("scan_events"."ticket_id" = "t"."id") AND ("e"."organizer_id" = "auth"."uid"())))) OR ("scanned_by_account_id" = ("auth"."uid"())::"text")));



CREATE POLICY "Organizers manage event artists" ON "public"."event_artists" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_artists"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Organizers manage own events" ON "public"."events" USING (("auth"."uid"() = "organizer_id"));



CREATE POLICY "Organizers manage own profile" ON "public"."organizer_profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Organizers manage own ticket types" ON "public"."ticket_types" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "ticket_types"."event_id") AND ("events"."organizer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "ticket_types"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Organizers manage scan accounts" ON "public"."scan_accounts" USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "scan_accounts"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Organizers manage their artists" ON "public"."artists" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Organizers manage their blogs" ON "public"."blogs" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Organizers view tickets for their events" ON "public"."tickets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "tickets"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Public can view artists" ON "public"."artists" FOR SELECT USING (true);



CREATE POLICY "Public can view event artists" ON "public"."event_artists" FOR SELECT USING (true);



CREATE POLICY "Public can view published blogs" ON "public"."blogs" FOR SELECT USING (("published" = true));



CREATE POLICY "Public read events" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Public read ticket_types" ON "public"."ticket_types" FOR SELECT USING (true);



CREATE POLICY "Public view tickets for active resale" ON "public"."tickets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resale_listings"
  WHERE (("resale_listings"."ticket_id" = "tickets"."id") AND ("resale_listings"."is_active" = true)))));



CREATE POLICY "Public views active resales" ON "public"."resale_listings" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Sellers manage own listings" ON "public"."resale_listings" USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Superadmins can manage roles" ON "public"."user_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "user_roles_1"
  WHERE (("user_roles_1"."user_id" = "auth"."uid"()) AND ("user_roles_1"."role" = 'superadmin'::"text")))));



CREATE POLICY "Timezones are viewable by everyone" ON "public"."timezones" FOR SELECT USING (true);



CREATE POLICY "Users can create own orders" ON "public"."orders" FOR INSERT WITH CHECK (("buyer_email" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Users can create scan events" ON "public"."scan_events" FOR INSERT WITH CHECK (("scanned_by_account_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can read/write ticket messages" ON "public"."support_ticket_messages" USING ((EXISTS ( SELECT 1
   FROM "public"."support_tickets"
  WHERE (("support_tickets"."id" = "support_ticket_messages"."ticket_id") AND (("support_tickets"."user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "user_roles"."user_id"
           FROM "public"."user_roles"
          WHERE ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"])))))))));



CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT USING (("buyer_email" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Users can view own tickets" ON "public"."support_tickets" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizer_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resale_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scan_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scan_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timezones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."buy_resale_ticket"("p_listing_id" "uuid", "p_buyer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."promote_admin_by_email"("target_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."promote_admin_by_email"("target_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_admin_by_email"("target_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."artists" TO "anon";
GRANT ALL ON TABLE "public"."artists" TO "authenticated";
GRANT ALL ON TABLE "public"."artists" TO "service_role";



GRANT ALL ON TABLE "public"."blogs" TO "anon";
GRANT ALL ON TABLE "public"."blogs" TO "authenticated";
GRANT ALL ON TABLE "public"."blogs" TO "service_role";



GRANT ALL ON TABLE "public"."event_artists" TO "anon";
GRANT ALL ON TABLE "public"."event_artists" TO "authenticated";
GRANT ALL ON TABLE "public"."event_artists" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."organizer_profiles" TO "anon";
GRANT ALL ON TABLE "public"."organizer_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."organizer_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."resale_listings" TO "anon";
GRANT ALL ON TABLE "public"."resale_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."resale_listings" TO "service_role";



GRANT ALL ON TABLE "public"."scan_accounts" TO "anon";
GRANT ALL ON TABLE "public"."scan_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."scan_events" TO "anon";
GRANT ALL ON TABLE "public"."scan_events" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_events" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_types" TO "anon";
GRANT ALL ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."timezones" TO "anon";
GRANT ALL ON TABLE "public"."timezones" TO "authenticated";
GRANT ALL ON TABLE "public"."timezones" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































