"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";

export function ForWhom() {
  const { t } = useLanguage();
  const { forWhom } = t;

  return (
    <section id="for-whom" className="py-20 sm:py-28">
      <div className="container-content">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{forWhom.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
              {forWhom.h2}
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {forWhom.blocks.map((block, i) => (
            <Reveal key={block.title} delay={(i % 2) * 100} as="article">
              <div className="card card-hover flex h-full flex-col p-7">
                <h3 className="font-serif text-2xl font-semibold text-cream">
                  {block.title}
                </h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-cream/70">
                  {block.value}
                </p>
                <a
                  href="#planner"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-gold-soft"
                >
                  {block.cta}
                  <span aria-hidden>→</span>
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
