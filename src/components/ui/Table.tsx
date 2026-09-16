"use client";

import type {
  ReactNode,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  caption: string;
  children: ReactNode;
}

export function Table({ caption, children, className = "", ...rest }: TableProps) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border-subtle">
      <table className={`w-full border-collapse text-start text-sm ${className}`} {...rest}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-muted">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border-subtle bg-surface">{children}</tbody>;
}

export function Tr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function Th({ children, className = "", ...rest }: ThProps) {
  const { lang } = useLanguage();
  return (
    <th
      {...rest}
      scope="col"
      className={`px-4 py-3 text-start text-xs font-semibold text-muted-foreground ${
        lang === "ar" ? "" : "uppercase tracking-wide"
      } ${className}`}
    >
      {children}
    </th>
  );
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
}

export function Td({ children, className = "", ...rest }: TdProps) {
  return (
    <td className={`px-4 py-3 align-middle text-foreground ${className}`} {...rest}>
      {children}
    </td>
  );
}
