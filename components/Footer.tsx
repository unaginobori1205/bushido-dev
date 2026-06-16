"use client";

import { useLanguage } from "@/components/LanguageProvider";

// TODO(social): replace with real profile URLs.
const SOCIAL = [
  { label: "LinkedIn", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "X / Twitter", href: "#" },
];

export function Footer() {
  const { t, lang, toggle } = useLanguage();
  const { footer, nav } = t;

  return (
    <footer className="border-t border-cream/10 bg-navy-deep py-14">
      <div className="container-content">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          {/* Brand / legal */}
          <div>
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="relative flex h-7 w-7 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-gold" />
                <span className="h-2 w-2 rounded-full bg-gold" />
              </span>
              <span className="font-serif text-xl font-semibold text-cream">
                BUSHIDO <span className="text-gold">AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              {footer.legal}
              <br />
              {footer.location}
              <br />
              {footer.singapore}
            </p>
            <a
              href="mailto:ken.pp.1205@gmail.com"
              className="mt-4 inline-block text-sm text-gold hover:text-gold-soft"
            >
              {footer.email}
            </a>
          </div>

          {/* Navigate */}
          <nav aria-label="Footer">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cream/45">
              {footer.nav}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {nav.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-cream/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Connect */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cream/45">
              {footer.social}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="text-sm text-cream/70 transition-colors hover:text-gold"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={toggle}
              className="mt-5 rounded-full border border-cream/25 px-3 py-1.5 text-xs font-semibold tracking-wider text-cream transition-colors hover:border-gold hover:text-gold"
            >
              {lang === "en" ? "日本語" : "English"}
            </button>
          </div>
        </div>

        <div className="mt-12 hairline" />
        <p className="mt-6 text-center text-xs text-cream/40">
          © {new Date().getFullYear()} BUSHIDO LLC（合同会社BUSHIDO）. {footer.rights}
        </p>
      </div>
    </footer>
  );
}
