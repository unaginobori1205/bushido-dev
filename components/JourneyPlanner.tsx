"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Reveal } from "@/components/Reveal";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function JourneyPlanner() {
  const { t, lang } = useLanguage();
  const { planner } = t;
  const formId = useId();

  const [interests, setInterests] = useState<string[]>([]);
  const [dates, setDates] = useState("");
  const [party, setParty] = useState("");
  const [audience, setAudience] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [emailError, setEmailError] = useState(false);

  const toggleInterest = (value: string) => {
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setStatus("submitting");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          interests,
          dates,
          party,
          audience,
          lang,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="planner"
      className="relative overflow-hidden border-y border-cream/10 bg-navy-deep/60 py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-20 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />
      </div>

      <div className="container-content">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <div className="text-center">
              <p className="eyebrow justify-center">{planner.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
                {planner.h2}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-cream/70">
                {planner.sub}
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card mt-10 p-6 sm:p-8">
              {status === "success" ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-center py-8 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-gold">
                    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
                      <path
                        d="M5 13l4 4L19 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h3 className="mt-5 font-serif text-2xl font-semibold text-cream">
                    {planner.success.title}
                  </h3>
                  <p className="mt-2 max-w-md text-cream/70">
                    {planner.success.body}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Interests */}
                  <fieldset>
                    <legend className="text-sm font-medium text-cream">
                      {planner.fields.interests}
                    </legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {planner.fields.interestsOptions.map((opt) => {
                        const active = interests.includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => toggleInterest(opt)}
                            aria-pressed={active}
                            className={`rounded-full border px-4 py-2 text-sm transition-all ${
                              active
                                ? "border-gold bg-gold/15 text-gold"
                                : "border-cream/20 text-cream/75 hover:border-cream/40"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Dates */}
                    <div>
                      <label
                        htmlFor={`${formId}-dates`}
                        className="text-sm font-medium text-cream"
                      >
                        {planner.fields.dates}
                      </label>
                      <input
                        id={`${formId}-dates`}
                        type="text"
                        value={dates}
                        onChange={(e) => setDates(e.target.value)}
                        placeholder={lang === "ja" ? "例:2026年秋" : "e.g. Autumn 2026"}
                        className="mt-2 w-full rounded-lg border border-cream/20 bg-navy/60 px-4 py-2.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none"
                      />
                    </div>

                    {/* Party size */}
                    <div>
                      <label
                        htmlFor={`${formId}-party`}
                        className="text-sm font-medium text-cream"
                      >
                        {planner.fields.party}
                      </label>
                      <select
                        id={`${formId}-party`}
                        value={party}
                        onChange={(e) => setParty(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-cream/20 bg-navy/60 px-4 py-2.5 text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="" className="bg-navy-deep">
                          —
                        </option>
                        {planner.fields.partyOptions.map((opt) => (
                          <option key={opt} value={opt} className="bg-navy-deep">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Audience */}
                  <div>
                    <label
                      htmlFor={`${formId}-audience`}
                      className="text-sm font-medium text-cream"
                    >
                      {planner.fields.audience}
                    </label>
                    <select
                      id={`${formId}-audience`}
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-cream/20 bg-navy/60 px-4 py-2.5 text-cream focus:border-gold focus:outline-none"
                    >
                      <option value="" className="bg-navy-deep">
                        —
                      </option>
                      {planner.fields.audienceOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-navy-deep">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor={`${formId}-email`}
                      className="text-sm font-medium text-cream"
                    >
                      {planner.fields.email}
                    </label>
                    <input
                      id={`${formId}-email`}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(false);
                      }}
                      aria-invalid={emailError}
                      aria-describedby={
                        emailError ? `${formId}-email-error` : undefined
                      }
                      placeholder={planner.fields.emailPlaceholder}
                      className={`mt-2 w-full rounded-lg border bg-navy/60 px-4 py-2.5 text-cream placeholder:text-cream/35 focus:outline-none ${
                        emailError
                          ? "border-red-400 focus:border-red-400"
                          : "border-cream/20 focus:border-gold"
                      }`}
                    />
                    {emailError && (
                      <p
                        id={`${formId}-email-error`}
                        className="mt-1.5 text-sm text-red-300"
                      >
                        {planner.fields.emailPlaceholder &&
                          (lang === "ja"
                            ? "有効なメールアドレスを入力してください。"
                            : "Please enter a valid email address.")}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="btn-primary w-full text-base disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "submitting"
                      ? planner.submitting
                      : planner.submit}
                  </button>

                  {status === "error" && (
                    <p
                      role="alert"
                      className="text-center text-sm text-red-300"
                    >
                      {planner.error}
                    </p>
                  )}

                  <p className="text-center text-xs text-cream/45">
                    {planner.privacy}
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
