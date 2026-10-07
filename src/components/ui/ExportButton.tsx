import { Download } from "lucide-react";

/** A download link styled like an outline button, for Excel exports. */
export function ExportButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="chamfer-br-sm inline-flex h-control-sm items-center gap-2 px-4 text-sm font-bold tracking-[var(--ls-label)] text-foreground shadow-[inset_0_0_0_2px_var(--brand-dark-nebula)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nebula-mint"
    >
      <Download aria-hidden="true" className="h-4 w-4" />
      {label}
    </a>
  );
}
