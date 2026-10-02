import { NextResponse } from "next/server";
import { getAccessibleAttachment } from "@/lib/attachments";
import { getAttachmentStream } from "@/lib/storage/blob";
import { UnauthenticatedError } from "@/lib/auth/authorization-errors";

// Streams a private blob out through this server, which re-checks access
// fresh on every request -- never a bare blob URL handed to the client,
// since these are confidential submission/report attachments. 404 for
// both an unknown id and a real one this caller isn't entitled to (see
// getAccessibleAttachment's own comment on why those collapse).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let attachment;
  try {
    attachment = await getAccessibleAttachment(id);
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    throw error;
  }
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await getAttachmentStream(attachment.storageKey);
  if (!blob || !blob.stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
    },
  });
}
