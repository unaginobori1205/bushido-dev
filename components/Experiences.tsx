"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { PlaceholderImage, type ImageSlot } from "@/components/PlaceholderImage";
import { Reveal } from "@/components/Reveal";

export function Experiences() {
  const { t } = useLanguage();
  const { experiences } = t;

  return (
    <section id="experiences" className="py-20 sm:py-28">
      <div className="container-content">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{experiences.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
              {experiences.h2}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-cream/70">
              {experiences.intro}
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.cards.map((card, i) => (
            <Reveal key={card.key} delay={(i % 3) * 100} as="li">
              <article className="card card-hover group h-full overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <PlaceholderImage
                    slot={card.key as ImageSlot}
                    alt={`${card.name} — ${card.line}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-navy-deep to-transparent" />
                  {/* Verified Master badge */}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-navy-deep/80 px-3 py-1 text-[11px] font-medium tracking-wide text-gold backdrop-blur">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L3.2 7.7l5.4-.8L12 2z"
                        fill="currentColor"
                      />
                    </svg>
                    {experiences.verified}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-2xl font-semibold text-cream">
                    {card.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/70">
                    {card.line}
                  </p>
                  <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-cream/10 pt-4 text-xs">
                    <div>
                      <dt className="uppercase tracking-wider text-cream/40">
                        {experiences.regionLabel}
                      </dt>
                      <dd className="mt-0.5 text-cream/85">{card.region}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wider text-cream/40">
                        {experiences.langLabel}
                      </dt>
                      <dd className="mt-0.5 text-cream/85">{card.languages}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
