"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";

export function HowItWorks() {
  const { t } = useLanguage();
  const { how } = t;

  return (
    <section
      id="how"
      className="border-y border-cream/10 bg-navy-deep/40 py-20 sm:py-28"
    >
      <div className="container-content">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{how.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
              {how.h2}
            </h2>
          </Reveal>
        </div>

        {/* 3-step diagram */}
        <ol className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent md:block"
          />
          {how.steps.map((step, i) => (
            <Reveal key={step.index} delay={i * 120} as="li">
              <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border border-gold/40 bg-navy" />
                  <span className="relative font-serif text-2xl font-semibold text-gold">
                    {step.index}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-cream">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-cream/70">
                  {step.body}
                </p>
                {i < how.steps.length - 1 && (
                  <span
                    aria-hidden
                    className="mt-6 text-gold/60 md:hidden"
                  >
                    ↓
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={160}>
          <p className="mt-16 text-center font-serif text-2xl italic text-gold sm:text-3xl">
            “{how.tagline}”
          </p>
        </Reveal>
      </div>
    </section>
  );
}
