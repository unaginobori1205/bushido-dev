"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { Reveal } from "@/components/Reveal";

export function Hero() {
  const { t } = useLanguage();
  const { hero } = t;

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-24 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-gold/5 blur-[120px]" />
      </div>

      <div className="container-content grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Copy */}
        <div className="max-w-xl">
          <Reveal>
            <p className="eyebrow">
              <span className="h-px w-6 bg-gold" aria-hidden />
              {hero.eyebrow}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] text-cream sm:text-5xl lg:text-6xl">
              {hero.h1}
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-cream/75">
              {hero.sub}
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={hero.ctas.primary.href} className="btn-primary">
                {hero.ctas.primary.label}
              </a>
              <a href={hero.ctas.secondary.href} className="btn-ghost">
                {hero.ctas.secondary.label}
              </a>
              <a href={hero.ctas.tertiary.href} className="btn-ghost">
                {hero.ctas.tertiary.label}
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <p className="mt-8 flex items-center gap-2 text-sm text-cream/55">
              <span
                className="inline-block h-1.5 w-1.5 animate-float-slow rounded-full bg-gold"
                aria-hidden
              />
              {hero.trust}
            </p>
          </Reveal>
        </div>

        {/* Visual */}
        <Reveal delay={200} className="relative">
          <div className="relative mx-auto max-w-lg lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border border-cream/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
              {/*
                TODO(assets): swap this hero slot for a refined looping video
                (<video autoPlay muted loop playsInline poster="...">) or real
                photography of kyudo / a tea room.
              */}
              <PlaceholderImage
                slot="hero"
                alt="A kyudo practitioner drawing the bow — the way of the bow"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full w-full object-cover"
              />
            </div>
            {/* Floating caption chip */}
            <div className="absolute bottom-4 left-4 rounded-full border border-gold/30 bg-navy-deep/80 px-4 py-2 text-xs tracking-wide text-cream/85 backdrop-blur">
              {hero.imageCaption}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
