import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

interface WaitlistPayload {
  email?: string;
  interests?: string[];
  dates?: string;
  party?: string;
  audience?: string;
  lang?: string;
}

// Minimal, dependency-free email check.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let payload: WaitlistPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = (payload.email ?? "").trim();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 422 }
    );
  }

  const record = {
    email,
    interests: Array.isArray(payload.interests) ? payload.interests : [],
    dates: payload.dates ?? "",
    party: payload.party ?? "",
    audience: payload.audience ?? "",
    lang: payload.lang ?? "en",
    submittedAt: new Date().toISOString(),
  };

  // ----------------------------------------------------------------------
  // First-party data capture.
  //
  // For local dev / demo we append each submission to data/waitlist.json
  // (gitignored). This proves the product signal end-to-end with zero setup.
  //
  // TODO(integration): swap this block for your real destination — e.g.
  //   • POST to a form service (Formspree, Resend, HubSpot, ConvertKit), or
  //   • insert into a database (Supabase, Planetscale, Notion), or
  //   • forward to your CRM.
  // On serverless hosts (Vercel) the filesystem is read-only/ephemeral, so a
  // managed destination is required in production.
  // ----------------------------------------------------------------------
  try {
    if (process.env.WAITLIST_FORWARD_URL) {
      // Optional: forward to an external endpoint if configured.
      await fetch(process.env.WAITLIST_FORWARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
    } else {
      const dir = path.join(process.cwd(), "data");
      await mkdir(dir, { recursive: true });
      await appendFile(
        path.join(dir, "waitlist.json"),
        JSON.stringify(record) + "\n",
        "utf8"
      );
    }
  } catch (err) {
    // Don't fail the user's submission on a storage hiccup; log for ops.
    console.error("[waitlist] failed to persist submission:", err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
