import { buildCompaniesWorkbook } from "@/lib/admin/exports";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";

export async function GET(): Promise<Response> {
  let file: Buffer;
  try {
    file = await buildCompaniesWorkbook();
  } catch (error) {
    if (error instanceof UnauthenticatedError) return new Response("Sign in required", { status: 401 });
    if (error instanceof ForbiddenError) return new Response("Not allowed", { status: 403 });
    throw error;
  }
  const date = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="falak-startups-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
