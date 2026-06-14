// HealthSurya V2 — AI Verification Assistant: OCR + quality check endpoint.
// POST /api/ai/ocr  { imageBase64, mimeType, docKey, role }
// Uses ANTHROPIC_API_KEY (preferred) or the existing AI_VERIFICATION_API_KEY
// (OpenAI-compatible) — and degrades gracefully when neither is configured.
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are the HealthSurya KYC document AI for an Indian healthcare platform.
Analyze the document image and respond with STRICT JSON only (no markdown), shaped as:
{"classified_as":string,"full_name":string|null,"dob":"YYYY-MM-DD"|null,"gender":"male"|"female"|"other"|null,
"registration_number":string|null,"quality_score":number,"authenticity_score":number,"flags":string[],"suggestion":string}
quality_score and authenticity_score are 0-100. Flag blur, glare, cropping, tampering, wrong document type.`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageBase64, mimeType, docKey, role } = await req.json().catch(() => ({}));
  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "imageBase64 and mimeType required" }, { status: 400 });
  }
  if (String(imageBase64).length > 8_000_000) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  const userPrompt = `Partner role: ${role || "patient"}\nExpected document: ${docKey || "identity document"}\nExtract fields and assess quality.`;

  // 1) Anthropic (preferred)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: SYSTEM,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
              { type: "text", text: userPrompt },
            ],
          }],
        }),
      });
      const data = await res.json();
      const text = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      return NextResponse.json({ ok: true, provider: "anthropic", result: parsed });
    } catch (err) {
      console.error("[ai/ocr] anthropic failed:", err);
    }
  }

  // 2) Existing OpenAI-compatible verification key (V1.5 compatibility)
  if (process.env.AI_VERIFICATION_API_KEY) {
    try {
      const res = await fetch(process.env.AI_VERIFICATION_API_URL ?? "https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.AI_VERIFICATION_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.AI_VERIFICATION_MODEL || "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            ]},
          ],
          response_format: { type: "json_object" },
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(String(text).replace(/```json|```/g, "").trim());
      return NextResponse.json({ ok: true, provider: "openai_compatible", result: parsed });
    } catch (err) {
      console.error("[ai/ocr] fallback provider failed:", err);
    }
  }

  // 3) Graceful degradation — manual review path, never block onboarding.
  return NextResponse.json({
    ok: true,
    provider: "none",
    result: {
      classified_as: docKey || "document",
      full_name: null, dob: null, gender: null, registration_number: null,
      quality_score: null, authenticity_score: null, flags: ["ai_not_configured"],
      suggestion: "Document saved. AI extraction is not configured — an admin will review it manually.",
    },
  });
}
