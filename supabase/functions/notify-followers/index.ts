import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { eventId, organizerId, eventName } = await req.json();

  // 1. Get all followers for this organizer
  const { data: followers, error: followerError } = await supabase
    .from("entity_followers")
    .select("user_id")
    .eq("entity_id", organizerId)
    .eq("entity_type", "organizer");

  if (followerError) return new Response(JSON.stringify({ error: followerError }), { status: 500 });

  // 2. Mock: Trigger Push Notification service for each follower
  // In production, integrate with FCM/OneSignal/etc.
  const notifications = followers.map((f) => ({
    user_id: f.user_id,
    title: "New Event Alert!",
    body: `${eventName} is happening soon. Check it out!`,
    data: { eventId }
  }));

  console.log("Triggering notifications:", notifications);

  return new Response(JSON.stringify({ success: true, count: notifications.length }), { status: 200 });
});
