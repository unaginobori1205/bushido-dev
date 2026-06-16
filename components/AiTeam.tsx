"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";

// Minimal line-art icon per AI agent, keyed by agent.key.
const ICONS: Record<string, React.ReactNode> = {
  designer: (
    <path
      d="M4 18l5-5 3 3 8-8M14 8h6v6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  matcher: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="8" r="3" />
      <circle cx="17" cy="16" r="3" />
      <path d="M9.5 9.8l5 4.4" strokeLinecap="round" />
    </g>
  ),
  bridge: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 7h8M7 4v3M9 7c0 4-3 6-6 7M6 9c0 2 2 3.5 4 4" />
      <path d="M14 20l3.5-8 3.5 8M15.2 17h4.6" />
    </g>
  ),
  logistics: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 16V7h10v9M13 10h4l3 3v3h-7" strokeLinejoin="round" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="16.5" cy="17.5" r="1.6" />
    </g>
  ),
  guardian: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" />
    </g>
  ),
  concierge: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M5 11a7 7 0 0114 0" />
      <rect x="3.5" y="11" width="3.5" height="6" rx="1.4" />
      <rect x="17" y="11" width="3.5" height="6" rx="1.4" />
      <path d="M19 17v1a3 3 0 01-3 3h-3" />
    </g>
  ),
};

export function AiTeam() {
  const { t } = useLanguage();
  const { aiTeam } = t;
  // Index of the currently expanded agent (single-open accordion). -1 = none.
  const [open, setOpen] = useState<number>(-1);

  return (
    <section id="ai-team" className="py-20 sm:py-28">
      <div className="container-content">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow justify-center">{aiTeam.eyebrow}</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
              {aiTeam.h2}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-cream/70">
              {aiTeam.intro}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-gold">
              <span aria-hidden>👆</span>
              {aiTeam.hint}
            </p>
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiTeam.agents.map((agent, i) => {
            const isOpen = open === i;
            const panelId = `ai-agent-panel-${agent.key}`;
            const btnId = `ai-agent-btn-${agent.key}`;
            return (
              <Reveal key={agent.key} delay={(i % 3) * 90} as="li">
                <div
                  className={`card h-full overflow-hidden transition-all duration-300 ${
                    isOpen
                      ? "border-gold/50 bg-white/[0.05]"
                      : "card-hover"
                  }`}
                >
                  <button
                    type="button"
                    id={btnId}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-start gap-4 p-6 text-left"
                  >
                    <span
                      className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl border transition-colors ${
                        isOpen
                          ? "border-gold bg-gold/15 text-gold"
                          : "border-gold/30 text-gold"
                      }`}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                        {ICONS[agent.key]}
                      </svg>
                    </span>
                    <span className="flex-1">
                      <span className="block font-serif text-xl font-semibold text-cream">
                        {agent.name}
                      </span>
                      <span className="mt-0.5 block text-xs uppercase tracking-wider text-gold/80">
                        {agent.role}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-cream/65">
                        {agent.summary}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={`flex-none text-gold transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                          d="M6 9l6 6 6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-6">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cream/45">
                          {aiTeam.tasksLabel}
                        </p>
                        <ul className="space-y-2.5">
                          {agent.tasks.map((task) => (
                            <li
                              key={task}
                              className="flex gap-2.5 text-sm leading-relaxed text-cream/80"
                            >
                              <span
                                aria-hidden
                                className="mt-1.5 h-1.5 w-1.5 flex-none rotate-45 bg-gold"
                              />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
