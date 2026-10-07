"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ViewerNavFlags } from "./viewer-roles";

const DEFAULT_FLAGS: ViewerNavFlags = { isFalakStaff: false, isManagementOrAdmin: false, isCompanyMember: false, isInvestorMember: false };

const ViewerNavFlagsContext = createContext<ViewerNavFlags>(DEFAULT_FLAGS);

// Fetched once, server-side, in the root layout (getViewerNavFlags) and
// handed down as a plain prop -- never refetched or mutated client-side,
// since these flags only need to be fresh as of the page load that
// rendered the Sidebar, same as every other server-fetched prop in this
// app.
export function ViewerNavFlagsProvider({ value, children }: { value: ViewerNavFlags; children: ReactNode }) {
  return <ViewerNavFlagsContext.Provider value={value}>{children}</ViewerNavFlagsContext.Provider>;
}

export function useViewerNavFlags(): ViewerNavFlags {
  return useContext(ViewerNavFlagsContext);
}
