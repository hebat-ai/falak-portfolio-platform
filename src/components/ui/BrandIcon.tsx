// Wrapper over Falak Ventures' proprietary raster icon set (39 glyphs,
// PNG-only, three fixed colorways -- no SVG source exists, so these can't
// be recolored in CSS). Only the specific icons this codebase actually
// uses are copied into public/brand-icons/ -- NOT the full 39x3 set --
// so an unavailable brand icon is a compile error via BRAND_ICON_NAME
// (below), not a silent 404. See src/app/globals.css and the design
// system's own components/core/Icon.jsx for the source pattern.
export type BrandIconName = "close";
export type BrandIconTone = "dark" | "white";

interface BrandIconProps {
  name: BrandIconName;
  tone?: BrandIconTone;
  size?: number;
  alt?: string;
  className?: string;
}

export function BrandIcon({ name, tone = "dark", size = 20, alt = "", className = "" }: BrandIconProps) {
  // Fixed-size brand glyph from a small local set -- next/image's overhead
  // isn't warranted here.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand-icons/${tone}/${name}.png`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      width={size}
      height={size}
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}
