import type { ReactNode } from "react";
import { Card } from "./Card";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}

export function KpiCard({ label, value, hint, className = "" }: KpiCardProps) {
  return (
    <Card padding="md" className={className}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-heading mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
