import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="button button-primary" href={href}>
      <Plus size={16} aria-hidden="true" />
      {children}
    </Link>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "success" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
