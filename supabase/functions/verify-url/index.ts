import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Basic URL validation
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return new Response(JSON.stringify({ exists: false, error: 'Invalid URL format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const domain = parsedUrl.hostname.toLowerCase();
    const isSocialMedia =
      domain.includes('instagram.com') ||
      domain.includes('twitter.com') ||
      domain.includes('x.com') ||
      domain.includes('spotify.com') ||
      domain.includes('facebook.com');

    if (isSocialMedia) {
      try {
        // We use a browser-like User-Agent to avoid immediate bot rejection
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          },
        });

        // 404 definitely means it doesn't exist.
        if (response.status === 404) {
          return new Response(JSON.stringify({ exists: false, isSocial: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Some platforms (like Instagram) return 200 but render a "Page Not Found" app.
        // We can inspect the HTML title or body.
        const html = await response.text();
        const htmlLower = html.toLowerCase();

        const isInstagramNotFound =
          domain.includes('instagram.com') &&
          (htmlLower.includes('<title>page not found') ||
            (htmlLower.includes('<title>instagram</title>') &&
              htmlLower.includes('page not found')));

        const isGenericNotFound =
          htmlLower.includes('<title>404') || htmlLower.includes('<title>page not found');

        if (isInstagramNotFound || isGenericNotFound) {
          return new Response(JSON.stringify({ exists: false, isSocial: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        return new Response(JSON.stringify({ exists: true, isSocial: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (error) {
        // If fetch completely fails (e.g., DNS error), it doesn't exist
        return new Response(
          JSON.stringify({ exists: false, isSocial: true, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // If it's not a known social media URL, we just return true and let the admin manually verify it.
    return new Response(JSON.stringify({ exists: true, isSocial: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
