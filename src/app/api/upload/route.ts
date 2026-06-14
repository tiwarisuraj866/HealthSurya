import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { NextResponse } from "next/server";
import { getUserIdFromServerRequest, getProfileFromServerRequest } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const userId = await getUserIdFromServerRequest();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;

    if (!file) {
      return new NextResponse("Bad Request - No file uploaded", { status: 400 });
    }

    // 3. File upload validation (Max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return new NextResponse("Payload Too Large - File size exceeds 10MB limit", { status: 413 });
    }

    const name = file.name || "document";
    const parts = name.toLowerCase().split(".");
    
    // Check for double extension attacks / dangerous intermediate extensions
    const dangerousExts = ["exe", "js", "bat", "sh", "php", "zip", "rar"];
    if (parts.length > 2) {
      const hasDangerous = parts.some((part) => dangerousExts.includes(part));
      if (hasDangerous) {
        return new NextResponse("Bad Request - Dangerous file structure detected", { status: 400 });
      }
    }

    // Check final extension
    const fileExt = parts[parts.length - 1];
    const allowedExts = ["pdf", "png", "jpg", "jpeg"];
    if (!allowedExts.includes(fileExt)) {
      return new NextResponse(`Forbidden - File type .${fileExt} not allowed`, { status: 400 });
    }

    // Check MIME type
    const allowedMimes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedMimes.includes(file.type)) {
      return new NextResponse(`Forbidden - Mime type ${file.type} not allowed`, { status: 400 });
    }

    // 4. Generate secure unique filename
    const secureUUID = crypto.randomUUID();
    const sanitizedFolder = (folder || "uploads").replace(/[^a-zA-Z0-9_\-]/g, "");
    const fileName = `${userId}/${sanitizedFolder}_${secureUUID}.${fileExt}`;

    // 5. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("verifications")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Upload API] Storage Upload Error:", uploadError.message);
      return new NextResponse("Internal Server Error during storage upload", { status: 500 });
    }

    // 6. Generate signed URL (valid for 1 year) for secure access
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from("verifications")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (signedError || !signedData?.signedUrl) {
      console.error("[Upload API] Signed URL Generation Error:", signedError?.message);
      return new NextResponse("Internal Server Error during signed URL generation", { status: 500 });
    }

    // 7. Write upload action to audit log
    const profile = await getProfileFromServerRequest();

    if (profile) {
      await (supabaseAdmin.from("audit_logs" as any) as any).insert({
        user_id: profile.id,
        action: "DOCUMENT_UPLOAD",
        entity_type: "VERIFICATION_DOCUMENT",
        entity_id: profile.id,
      } as any);
    }

    console.log(`[Upload API] Securely uploaded: ${fileName} for user: ${userId}`);
    return NextResponse.json({
      url: signedData.signedUrl,
      path: fileName,
    });
  } catch (err: any) {
    console.error("[Upload API] Error in secure upload route:", err);
    return new NextResponse(err.message || "Internal Server Error", { status: 500 });
  }
}
