import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { resolveLandingPath } from "@/lib/auth/landing";
import { HomeMarketing } from "./HomeMarketing";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    const landingPath = await resolveLandingPath(user.id);
    redirect(landingPath);
  }

  return <HomeMarketing />;
}
