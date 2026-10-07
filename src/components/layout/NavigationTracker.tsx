"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { recordVisit } from "@/lib/navigation-history";

/** Records each page the user lands on, for the Back button. Renders nothing. */
export function NavigationTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    recordVisit(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);

  return null;
}
