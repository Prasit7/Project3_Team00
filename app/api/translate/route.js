import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TRANSLATE_API_URL = "https://translation.googleapis.com/language/translate/v2";
const MAX_TEXTS = 200;

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'");
}

function toSafeTexts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0)
    .slice(0, MAX_TEXTS);
}

export async function POST(request) {
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing GOOGLE_CLOUD_TRANSLATE_API_KEY server environment variable.",
      },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }

  const texts = toSafeTexts(body?.texts);
  const source = String(body?.source || "en").trim().toLowerCase();
  const target = String(body?.target || "").trim().toLowerCase();

  if (!target) {
    return NextResponse.json({ ok: false, error: "Missing target language code." }, { status: 400 });
  }

  if (!texts.length) {
    return NextResponse.json({ ok: true, translations: [] });
  }

  const params = new URLSearchParams();
  texts.forEach((text) => params.append("q", text));
  params.set("source", source);
  params.set("target", target);
  params.set("format", "text");

  try {
    const response = await fetch(`${TRANSLATE_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: params.toString(),
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: payload?.error?.message || "Translation request failed.",
        },
        { status: response.status }
      );
    }

    const translations = Array.isArray(payload?.data?.translations)
      ? payload.data.translations.map((entry) => decodeHtmlEntities(entry?.translatedText || ""))
      : [];

    return NextResponse.json({ ok: true, translations });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to reach translation service.",
      },
      { status: 500 }
    );
  }
}

