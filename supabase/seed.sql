-- Insert Users into auth.users
-- Password is 'password123' (bcrypt hash)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'superadmin@admit.com', '$2a$10$wE6vKkVr1yq27Z7fDwvK3.K/gD82Q8sQxK6wXgV2iJ5J7wO3O8xXm', NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Super Admin"}', NOW(), NOW(), 'authenticated', '', '', '', ''),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'admin@admit.com', '$2a$10$wE6vKkVr1yq27Z7fDwvK3.K/gD82Q8sQxK6wXgV2iJ5J7wO3O8xXm', NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Standard Admin"}', NOW(), NOW(), 'authenticated', '', '', '', ''),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'organizer@events.com', '$2a$10$wE6vKkVr1yq27Z7fDwvK3.K/gD82Q8sQxK6wXgV2iJ5J7wO3O8xXm', NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Event Organizer"}', NOW(), NOW(), 'authenticated', '', '', '', ''),
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'fan@music.com', '$2a$10$wE6vKkVr1yq27Z7fDwvK3.K/gD82Q8sQxK6wXgV2iJ5J7wO3O8xXm', NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Music Fan"}', NOW(), NOW(), 'authenticated', '', '', '', '');

-- Insert auth.identities
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub": "11111111-1111-1111-1111-111111111111", "email": "superadmin@admit.com"}', 'email', NOW(), NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub": "22222222-2222-2222-2222-222222222222", "email": "admin@admit.com"}', 'email', NOW(), NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub": "33333333-3333-3333-3333-333333333333", "email": "organizer@events.com"}', 'email', NOW(), NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '{"sub": "44444444-4444-4444-4444-444444444444", "email": "fan@music.com"}', 'email', NOW(), NOW(), NOW());

-- Insert User Roles
INSERT INTO public.user_roles (user_id, role) VALUES
('11111111-1111-1111-1111-111111111111', 'superadmin'),
('22222222-2222-2222-2222-222222222222', 'admin');

-- Insert Organizer Profiles
INSERT INTO public.organizers (id, name, stripe_account_id, is_verified, claimed_by_user_id) VALUES
('33333333-3333-3333-3333-333333333333', 'Starlight Productions', 'acct_12345', TRUE, '33333333-3333-3333-3333-333333333333');

-- Insert Events
INSERT INTO public.events (id, organizer_id, organizer_name, name, description, venue, start_date, timezone_id, published, approval_status, images) VALUES
('10000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'Starlight Productions', 'Neon Nights Festival', 'The biggest electronic music festival of the year.', 'Downtown Arena', NOW() + INTERVAL '30 days', 'gmt0_london', TRUE, 'approved', '{"https://images.unsplash.com/photo-1540039155732-6761b54cb6b0?w=1200"}'),
('20000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'Starlight Productions', 'Underground Jazz Evening', 'Intimate jazz sessions featuring local talent.', 'The Blue Note', NOW() + INTERVAL '15 days', 'gmt0_london', TRUE, 'pending', '{"https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200"}');

-- Insert Support Tickets
INSERT INTO public.support_tickets (user_id, email, subject, message, status) VALUES
('44444444-4444-4444-4444-444444444444', 'fan@music.com', 'Cannot access my VIP ticket', 'I bought a VIP ticket for Neon Nights but it is not showing up in my wallet. Please help!', 'open'),
('44444444-4444-4444-4444-444444444444', 'fan@music.com', 'Refund request', 'I can no longer attend the Jazz Evening. What is the refund policy?', 'open');
