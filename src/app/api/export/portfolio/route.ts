import { buildPortfolioWorkbook } from "@/lib/admin/exports";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";

export async function GET(): Promise<Response> {
  let file: Buffer;
  try {
    file = await buildPortfolioWorkbook();
  } catch (error) {
    if (error instanceof UnauthenticatedError) return new Response("Sign in required", { status: 401 });
    if (error instanceof ForbiddenError) return new Response("Not allowed", { status: 403 });
    throw error;
  }
  const date = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="falak-portfolio-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
