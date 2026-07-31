import Link from "next/link";
import { Flame } from "lucide-react";

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold tracking-tight">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        <Flame size={18} strokeWidth={2.4} fill="currentColor" />
      </span>
      <span className="text-[17px]">ScoutApp</span>
    </Link>
  );
}
