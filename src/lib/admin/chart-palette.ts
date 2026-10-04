// A small, cyclable categorical palette for charts with an open-ended
// number of series (one line per vehicle, one stacked segment per
// startup, etc.) -- the design system's CSS variables only define 5
// fixed, status-specific chart colors (--chart-draft, etc.), none of
// which are meant for an arbitrary-cardinality legend. Built from the
// same brand hues via color-mix so it still matches the rest of the UI
// in both light and dark mode (these are CSS custom properties, not
// literal hex, so they repaint automatically on theme change).
const PALETTE = [
  "var(--brand-nebula-aqua)",
  "var(--brand-lime-green)",
  "var(--brand-nebula-mint)",
  "color-mix(in srgb, var(--brand-dark-nebula) 55%, var(--brand-nebula-aqua) 45%)",
  "color-mix(in srgb, var(--brand-lime-green) 60%, var(--brand-dark-nebula) 40%)",
  "color-mix(in srgb, var(--brand-nebula-aqua) 50%, var(--brand-lime-green) 50%)",
  "color-mix(in srgb, var(--brand-nebula-mint) 60%, var(--brand-dark-nebula) 40%)",
  "color-mix(in srgb, var(--brand-nebula-aqua) 70%, white 30%)",
] as const;

export function getSeriesColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
