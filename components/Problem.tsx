"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";

export function Problem() {
  const { t } = useLanguage();
  const { problem } = t;

  return (
    <section id="problem" className="py-20 sm:py-28">
      <div className="container-content">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{problem.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
              {problem.h2}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-cream/70">
              {problem.body}
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {problem.stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100} as="article">
              <div className="card card-hover h-full p-7 text-center">
                <div className="font-serif text-4xl font-semibold text-gold sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-3 text-base font-medium text-cream">
                  {stat.label}
                </div>
                {stat.note && (
                  <div className="mt-1 text-sm text-cream/50">{stat.note}</div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-6 text-center text-xs text-cream/40">
            {problem.source}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
