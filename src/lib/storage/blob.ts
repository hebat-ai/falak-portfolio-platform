import "server-only";
import { put, del, get } from "@vercel/blob";

// Store (falak-attachments) was provisioned with --access private -- every
// call here is private, matching that: these are submission financials/
// decks and review attachments, never meant to be reachable by a bare
// bearer URL. Auth is OIDC (BLOB_STORE_ID + VERCEL_OIDC_TOKEN, both set by
// `vercel storage connect`) -- no BLOB_READ_WRITE_TOKEN to manage.

export interface UploadedBlob {
  pathname: string;
  size: number;
  contentType: string;
}

export async function uploadAttachment(pathname: string, body: Blob, contentType: string): Promise<UploadedBlob> {
  const result = await put(pathname, body, {
    access: "private",
    contentType,
    addRandomSuffix: true,
  });
  return { pathname: result.pathname, size: body.size, contentType };
}

export async function deleteAttachment(pathname: string): Promise<void> {
  await del(pathname);
}

/**
 * Streams a private blob back out -- the caller (an API route) must have
 * already re-verified the requesting user is actually allowed to see this
 * specific attachment before calling this; this function itself does no
 * authorization of its own, same "auth happens at the real entry point"
 * discipline as fetchSubmissionMetricFields.
 */
export async function getAttachmentStream(pathname: string) {
  return get(pathname, { access: "private" });
}
