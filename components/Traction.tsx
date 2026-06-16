"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";

export function Traction() {
  const { t } = useLanguage();
  const { traction } = t;

  return (
    <section
      id="traction"
      className="border-y border-cream/10 bg-navy-deep/40 py-20 sm:py-28"
    >
      <div className="container-content">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{traction.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
              {traction.h2}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-cream/70">
              {traction.intro}
            </p>
          </Reveal>
        </div>

        {/* Timeline */}
        <ol className="relative mx-auto mt-14 max-w-3xl">
          <div
            aria-hidden
            className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-gold/50 via-gold/20 to-transparent sm:left-[9px]"
          />
          {traction.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 90} as="li">
              <div className="relative mb-8 pl-8 sm:pl-12 last:mb-0">
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-gold bg-navy"
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                  {item.date}
                </span>
                <h3 className="mt-1 text-xl font-semibold text-cream">
                  {item.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-cream/70">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
