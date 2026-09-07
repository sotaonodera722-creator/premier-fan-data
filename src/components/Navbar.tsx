"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/matches", label: "試合" },
  { href: "/teams", label: "チーム" },
  { href: "/players", label: "選手名鑑" },
  { href: "/standings", label: "順位表" },
  { href: "/compare", label: "対戦成績比較" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="-my-1 flex min-h-[44px] items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">
            PL
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-wide text-foreground">
            Premier Fan <span className="text-accent-2">Data</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-[44px] items-center rounded-md px-3.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                  active
                    ? "bg-surface-2 text-accent"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:hidden"
          aria-label="メニュー"
        >
          <span className="text-lg leading-none">{open ? "×" : "≡"}</span>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 sm:hidden">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`inline-flex min-h-[44px] items-center rounded-md px-3.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                  active ? "bg-surface-2 text-accent" : "text-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
