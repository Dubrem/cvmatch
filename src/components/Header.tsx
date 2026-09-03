"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sparkles, User } from "lucide-react";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#casos-de-exito", label: "Casos de éxito" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-mint text-white">
            <Sparkles size={18} />
          </span>
          <span className="text-lg font-bold text-navy">MatchCV</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition hover:text-navy"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/cuenta"
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-navy"
          >
            <User size={16} />
            Mi cuenta
          </Link>
          <Link
            href="/analisis"
            className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
          >
            Diagnóstico gratis
          </Link>
        </div>

        <button
          className="text-navy md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/cuenta"
              className="flex items-center gap-1.5 text-sm font-medium text-muted"
              onClick={() => setOpen(false)}
            >
              <User size={16} />
              Mi cuenta
            </Link>
            <Link
              href="/analisis"
              className="mt-2 rounded-lg bg-navy px-5 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Diagnóstico gratis
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
