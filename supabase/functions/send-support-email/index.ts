import { serve } from "https://deno.land/std@0.192.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const payload = await req.json();
    const { record } = payload;
    
    // Check if we have the necessary data
    if (!record || !record.email || !record.subject) {
      return new Response("Invalid payload", { status: 400 });
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Simulating email send for support ticket.");
      return new Response(JSON.stringify({ message: "Simulated email sent" }), { status: 200 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Support <support@reactticket.app>",
        to: [record.email],
        subject: `Re: ${record.subject} (Ticket #${record.id.split('-')[0]})`,
        html: `
          <h3>We received your support ticket</h3>
          <p>Hi there,</p>
          <p>This is an automated confirmation that we've received your request:</p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 10px;">
            ${record.message.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c])}
          </blockquote>
          <p>Our team will review your issue and get back to you shortly.</p>
          <p>Best,<br/>ReactTicket Support Team</p>
        `,
      }),
    });

    if (res.ok) {
      return new Response(JSON.stringify({ message: "Email sent" }), { status: 200 });
    } else {
      const errorText = await res.text();
      return new Response(JSON.stringify({ error: errorText }), { status: 400 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
