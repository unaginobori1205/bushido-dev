"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

function Logo() {
  return (
    <a
      href="#top"
      className="flex items-center gap-2.5 text-cream"
      aria-label="BUSHIDO AI — home"
    >
      <span
        aria-hidden
        className="relative flex h-7 w-7 items-center justify-center"
      >
        <span className="absolute inset-0 rounded-full border-2 border-gold" />
        <span className="h-2 w-2 rounded-full bg-gold" />
      </span>
      <span className="font-serif text-xl font-semibold tracking-wide">
        BUSHIDO <span className="text-gold">AI</span>
      </span>
    </a>
  );
}

function LangToggle() {
  const { lang, toggle, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-cream/25 px-3 py-1.5 text-xs font-semibold tracking-wider text-cream transition-colors hover:border-gold hover:text-gold"
      aria-label={
        lang === "en" ? "Switch to Japanese" : "Switch to English / 英語に切り替え"
      }
    >
      {t.nav.langLabel}
    </button>
  );
}

export function Nav() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-cream/10 bg-navy-deep/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className="container-content flex h-16 items-center justify-between"
        aria-label="Primary"
      >
        <Logo />

        {/* Desktop links */}
        <ul className="hidden items-center gap-7 lg:flex">
          {t.nav.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-cream/80 transition-colors hover:text-gold"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <LangToggle />
          <a href="#planner" className="btn-primary hidden sm:inline-flex">
            {t.nav.cta}
          </a>
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-cream lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-current transition-all ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-5 bg-current transition-all ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-current transition-all ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-cream/10 bg-navy-deep/95 backdrop-blur-md lg:hidden ${
          open ? "max-h-[28rem]" : "max-h-0"
        } transition-[max-height] duration-300`}
      >
        <ul className="container-content flex flex-col gap-1 py-4">
          {t.nav.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-3 text-cream/85 transition-colors hover:bg-white/5 hover:text-gold"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="pt-2">
            <a
              href="#planner"
              onClick={() => setOpen(false)}
              className="btn-primary w-full"
            >
              {t.nav.cta}
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
