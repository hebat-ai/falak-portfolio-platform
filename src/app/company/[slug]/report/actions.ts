"use server";

import { revalidatePath } from "next/cache";
import { uploadReportVersionAttachment } from "@/lib/company/report-attachments";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/authorization-errors";

export interface UploadReportAttachmentState {
  error: string | null;
  success: boolean;
}

const GENERIC_ACCESS_DENIED = "You do not have access to do this.";
const GENERIC_UPLOAD_ERROR = "Choose a file to upload.";

export async function uploadReportAttachmentAction(
  reportVersionId: string,
  companySlug: string,
  periodLabel: string,
  _prevState: UploadReportAttachmentState,
  formData: FormData
): Promise<UploadReportAttachmentState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: GENERIC_UPLOAD_ERROR, success: false };
  }

  try {
    const result = await uploadReportVersionAttachment(reportVersionId, file);
    if (!result.success) {
      return { error: result.error, success: false };
    }
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof ForbiddenError) {
      return { error: GENERIC_ACCESS_DENIED, success: false };
    }
    throw error;
  }

  revalidatePath(`/company/${companySlug}/report?period=${encodeURIComponent(periodLabel)}`);
  return { error: null, success: true };
}
