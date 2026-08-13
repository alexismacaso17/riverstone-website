// Vercel serverless function — receives the contact form and sends an email via Resend.
// Endpoint: POST /api/contact   (Vercel exposes files in /api automatically)
//
// Required environment variables (set these in the Vercel dashboard, never in code):
//   RESEND_API_KEY      — your Resend API key
//   CONTACT_TO_EMAIL    — where inquiries should be delivered (e.g. joel@theriverstonegroup.com)
// Optional:
//   CONTACT_FROM_EMAIL  — verified sender, e.g. "The Riverstone Group <inquiries@theriverstonegroup.com>"
//                         Until your domain is verified in Resend, this falls back to Resend's
//                         test sender (onboarding@resend.dev), which only delivers to the
//                         Resend account owner's address.

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "The Riverstone Group <onboarding@resend.dev>";
  if (!key || !to) {
    return res.status(500).json({ ok: false, error: "The contact form is not configured yet." });
  }

  // Vercel parses JSON bodies automatically; guard just in case.
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // Honeypot — real users never fill this hidden field; bots often do.
  if (String(body.company || "").trim()) {
    return res.status(200).json({ ok: true });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const method = String(body.method || "").trim();
  const agent = String(body.agent || "").trim();
  const message = String(body.message || "").trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk) {
    return res.status(400).json({ ok: false, error: "Please include your name and a valid email." });
  }

  const rows = [
    ["Name", name],
    ["Email", email],
    phone ? ["Phone", phone] : null,
    method ? ["Preferred contact", method] : null,
    agent ? ["Represented by an agent", agent] : null,
  ].filter(Boolean);

  const text =
    rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n") +
    "\n\nMessage:\n" + (message || "(none)");

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#383838;line-height:1.6">' +
    "<h2 style=\"font-size:18px;margin:0 0 12px\">New inquiry — theriverstonegroup.com</h2>" +
    rows.map(function (r) {
      return '<p style="margin:2px 0"><strong>' + esc(r[0]) + ":</strong> " + esc(r[1]) + "</p>";
    }).join("") +
    '<p style="margin:14px 0 4px"><strong>Message:</strong></p>' +
    '<p style="margin:0;white-space:pre-wrap">' + (esc(message) || "(none)") + "</p>" +
    "</div>";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from,
        to: [to],
        reply_to: email,
        subject: "New inquiry from " + name + " — The Riverstone Group",
        text: text,
        html: html,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(function () { return ""; });
      console.error("Resend error", r.status, detail);
      return res.status(502).json({ ok: false, error: "The email service returned an error." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact function error", err);
    return res.status(500).json({ ok: false, error: "Something went wrong sending your message." });
  }
}
