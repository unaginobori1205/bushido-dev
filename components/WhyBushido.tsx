"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";

const ICONS = [
  // Authentic insider — a brush stroke
  (
    <path
      key="brush"
      d="M5 19c4-1 6-4 8-8M14 11c1.5-3 4-5 5-5 1 1-1 3.5-4 5M12 13l-2 6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
  ),
  // Verified trust network — linked nodes
  (
    <g key="net" stroke="currentColor" strokeWidth="1.6" fill="none">
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M7.7 7.3l3 8.4M16.3 8.6l-3 7M8 6.5h8" strokeLinecap="round" />
    </g>
  ),
  // AI + human trust — node + spark
  (
    <g key="ai" stroke="currentColor" strokeWidth="1.6" fill="none">
      <rect x="7" y="7" width="10" height="10" rx="2.5" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17 17l1.5 1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" />
    </g>
  ),
];

export function WhyBushido() {
  const { t } = useLanguage();
  const { why } = t;

  return (
    <section
      id="why"
      className="border-y border-cream/10 bg-navy-deep/40 py-20 sm:py-28"
    >
      <div className="container-content">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{why.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
              {why.h2}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-cream/70">
              {why.intro}
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {why.pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 120} as="article">
              <div className="card card-hover h-full p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 text-gold">
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    {ICONS[i]}
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-cream">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-cream/70">
                  {pillar.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
