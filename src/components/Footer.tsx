import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan to-mint text-white">
            <Sparkles size={14} />
          </span>
          <span className="text-sm font-bold text-navy">MatchCV</span>
        </Link>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} MatchCV. Ayudando a egresados a
          conseguir su primer empleo.
        </p>
      </div>
    </footer>
  );
}
