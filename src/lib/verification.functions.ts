import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const AnalyzeInput = z.object({
  verificationId: z.string().uuid(),
  documentId: z.string().uuid(),
  documentType: z.string().min(1).max(64),
  partnerType: z.string().min(1).max(64),
  imageBase64: z.string().min(100).max(15_000_000), // ~10MB
  mimeType: z.string().regex(/^image\/(png|jpe?g|webp)$/),
});

type AIResult = {
  classified_as: string;
  full_name: string | null;
  registration_number: string | null;
  authority_name: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  address: string | null;
  quality_score: number;
  authenticity_score: number;
  tamper_flags: string[];
  notes: string;
};

export async function analyzeDocument(rawInput: unknown) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const data = AnalyzeInput.parse(rawInput);

  // Ownership check
  const { data: ver, error: vErr } = (await supabaseAdmin
    .from("partner_verifications" as any)
    .select("id, partner_id")
    .eq("id", data.verificationId)
    .single()) as any;

  if (vErr || !ver || ver.partner_id !== userId) {
    throw new Error("Not authorized for this verification");
  }

  const AI_API_KEY = process.env.AI_VERIFICATION_API_KEY;
  const AI_API_URL =
    process.env.AI_VERIFICATION_API_URL ?? "https://api.openai.com/v1/chat/completions";
  if (!AI_API_KEY) throw new Error("AI_VERIFICATION_API_KEY is not configured on the server");

  const system = `You are a document verification AI for an Indian healthcare platform.
Analyze the uploaded document image and return STRICT JSON only matching the tool schema.
Detect tampering (photoshop, cropping, mismatched fonts, missing seals/signatures).
Extract registration numbers exactly as printed. Dates must be ISO (YYYY-MM-DD) or null.`;

  const user = `Partner type: ${data.partnerType}
Expected document type: ${data.documentType}
Validate this document and extract its key fields.`;

  const body = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: user },
          { type: "image_url", image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` } },
        ],
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "report_document",
          description: "Return extracted fields and scores for the document.",
          parameters: {
            type: "object",
            properties: {
              classified_as: { type: "string", description: "What the document actually appears to be" },
              full_name: { type: ["string", "null"] },
              registration_number: { type: ["string", "null"] },
              authority_name: { type: ["string", "null"] },
              issue_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
              expiry_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
              address: { type: ["string", "null"] },
              quality_score: { type: "number", description: "0-100 image/legibility quality" },
              authenticity_score: { type: "number", description: "0-100 likelihood of authenticity" },
              tamper_flags: { type: "array", items: { type: "string" } },
              notes: { type: "string" },
            },
            required: [
              "classified_as", "quality_score", "authenticity_score",
              "tamper_flags", "notes",
            ],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "report_document" } },
  };

  const resp = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    if (resp.status === 429) throw new Error("AI rate limit. Please retry shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Add funds in Workspace > Usage.");
    console.error("AI gateway error:", resp.status, txt);
    throw new Error(`AI gateway error (${resp.status})`);
  }

  const json: any = await resp.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("AI returned no structured result");
  let parsed: AIResult;
  try {
    parsed = JSON.parse(call.function.arguments);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  // Risk scoring (per spec weights)
  const expiryOk = parsed.expiry_date
    ? new Date(parsed.expiry_date).getTime() > Date.now()
    : false;
  const hasReg = !!parsed.registration_number;
  const hasAuth = !!parsed.authority_name;
  const tamperPenalty = Math.min(40, (parsed.tamper_flags?.length || 0) * 15);

  const authenticity = Math.max(0, (parsed.authenticity_score ?? 0) - tamperPenalty);
  const regScore = hasReg && hasAuth ? 100 : hasReg ? 60 : 0;
  const expiryScore = parsed.expiry_date == null ? 50 : expiryOk ? 100 : 0;
  const identityScore = parsed.full_name ? 100 : 50;

  const overall = Math.round(
    authenticity * 0.30 + regScore * 0.40 + expiryScore * 0.15 + identityScore * 0.15,
  );

  const ai_score = Math.min(100, Math.max(0, overall));

  // Save extracted data on the document
  await (supabaseAdmin
    .from("verification_documents" as any) as any)
    .update({
      extracted_data: parsed,
      ai_score,
      flags: parsed.tamper_flags,
      classified_as: parsed.classified_as,
    } as any)
    .eq("id" as any, data.documentId);

  // Bubble up best-known fields to the parent verification
  const update: Record<string, unknown> = {};
  if (parsed.full_name) update.full_name = parsed.full_name;
  if (parsed.registration_number) update.registration_number = parsed.registration_number;
  if (parsed.authority_name) update.authority_name = parsed.authority_name;
  if (parsed.issue_date) update.issue_date = parsed.issue_date;
  if (parsed.expiry_date) update.expiry_date = parsed.expiry_date;
  if (parsed.address) update.address = parsed.address;
  update.ai_summary = parsed.notes;
  update.verification_score = ai_score;
  update.risk_breakdown = {
    authenticity, regScore, expiryScore, identityScore, tamperPenalty,
  };
  update.status = "ai_in_progress";
  await (supabaseAdmin.from("partner_verifications" as any) as any).update(update as any).eq("id" as any, data.verificationId);

  await (supabaseAdmin.from("verification_logs" as any) as any).insert({
    verification_id: data.verificationId,
    actor_id: userId,
    action: "ai_analyzed",
    remarks: `Score ${ai_score}`,
    metadata: { documentId: data.documentId, ai_score, flags: parsed.tamper_flags },
  } as any);

  return { ai_score, extracted: parsed };
}
