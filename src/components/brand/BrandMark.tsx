interface BrandMarkProps {
  variant?: "on-dark" | "on-light";
  className?: string;
}

/**
 * The real Falak Ventures logo artwork -- sourced from the project owner's
 * own "Falak Ventures Design System" project (not the old colleague
 * references/ path; see PROTOTYPE_NOTES.md). White lockup for a dark
 * background (Sidebar, MobileDrawer), full-color lockup everywhere else.
 */
export function BrandMark({ variant = "on-light", className = "" }: BrandMarkProps) {
  const src = variant === "on-dark" ? "/brand/falak-ventures-horizontal-white.png" : "/brand/falak-ventures-horizontal-color.png";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- fixed static brand asset, not a candidate for next/image's responsive sizing.
    <img src={src} alt="Falak Ventures" className={`h-8 w-auto ${className}`} />
  );
}
