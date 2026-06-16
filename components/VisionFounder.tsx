"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { Reveal } from "@/components/Reveal";

export function VisionFounder() {
  const { t } = useLanguage();
  const { vision } = t;

  return (
    <section id="vision" className="py-20 sm:py-28">
      <div className="container-content">
        {/* Vision statement */}
        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <p className="eyebrow justify-center">{vision.eyebrow}</p>
            <blockquote className="mt-6 font-serif text-3xl font-medium leading-snug text-cream sm:text-4xl lg:text-5xl">
              “{vision.statement}”
            </blockquote>
          </div>
        </Reveal>

        {/* Founder */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14">
          <Reveal>
            <div className="mx-auto max-w-sm">
              <div className="overflow-hidden rounded-3xl border border-cream/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
                {/* TODO(assets): replace with a real portrait of Kensuke Ueoka. */}
                <PlaceholderImage
                  slot="founder"
                  alt="Portrait of Kensuke Ueoka, Founder & CEO of BUSHIDO AI"
                  sizes="(max-width: 1024px) 80vw, 40vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-center text-xs text-cream/50">
                {vision.photoCaption}
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div>
              <h2 className="text-3xl font-semibold text-cream sm:text-4xl">
                {vision.h2}
              </h2>
              <p className="mt-2 text-sm font-medium uppercase tracking-wider text-gold">
                {vision.founderName} · {vision.founderRole}
              </p>
              <div className="mt-6 space-y-4">
                {vision.founderStory.map((para, i) => (
                  <p
                    key={i}
                    className="text-base leading-relaxed text-cream/75"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
