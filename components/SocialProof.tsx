"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function SocialProof() {
  const { t } = useLanguage();
  const { socialProof } = t;

  return (
    <section
      aria-label={socialProof.label}
      className="border-y border-cream/10 bg-navy-deep/40 py-8"
    >
      <div className="container-content">
        <p className="text-center text-xs uppercase tracking-[0.22em] text-cream/45">
          {socialProof.label}
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
          {socialProof.partners.map((partner) => (
            <li
              key={partner.name}
              className="flex items-center gap-2 text-cream/55 transition-colors hover:text-cream/80"
            >
              {/* TODO(assets): replace each text label with a real partner logo
                  (next/image, monochrome on dark). Slots named by partner. */}
              <span
                aria-hidden
                className="h-2 w-2 rotate-45 border border-gold/50"
              />
              <span className="font-serif text-base sm:text-lg">
                {partner.name}
              </span>
              {partner.tag && (
                <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                  {partner.tag}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
