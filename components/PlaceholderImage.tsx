import Image from "next/image";

/**
 * Named image slots. Slots that have real photography point at the dropped-in
 * file (.jpg); slots still awaiting a real photo point at the generated
 * /public/images/<slot>.svg placeholder.
 *
 * TODO(assets): As real photos arrive, point the slot at the new file here.
 * Provided photos (commit to /public/images with these exact names):
 *   hero.jpg        — kyudo dojo, group lesson (wide)
 *   kyudo.jpg       — kyudo one-on-one instruction
 *   tea.jpg         — tea ceremony
 *   calligraphy.jpg — calligraphy
 *   zen.jpg         — seated meditation
 *   shrine.jpg      — couple in wedding kimono at a shrine
 *   samurai.jpg     — samurai armor at Nagoya Castle (Corporates block)
 *   founder.jpg     — portrait of Kensuke Ueoka (上岡賢輔.jpg)
 * All 8 are wired. Until a .jpg is committed the live site 404s that slot;
 * `npm run preview` falls back to the matching .svg placeholder.
 */
export type ImageSlot =
  | "hero"
  | "kyudo"
  | "tea"
  | "calligraphy"
  | "zen"
  | "shrine"
  | "samurai"
  | "founder"
  | "sakura";

const SLOTS: Record<ImageSlot, string> = {
  hero: "/images/hero.jpg",
  kyudo: "/images/kyudo.jpg",
  tea: "/images/tea.jpg",
  calligraphy: "/images/calligraphy.jpg",
  zen: "/images/zen.jpg",
  shrine: "/images/shrine.jpg",
  samurai: "/images/samurai.jpg",
  founder: "/images/founder.jpg",
  // Decorative only — no real photo planned; keeps the generated placeholder.
  sakura: "/images/sakura.svg",
};

interface PlaceholderImageProps {
  slot: ImageSlot;
  /** Required, descriptive alt text — keep it meaningful for accessibility. */
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  /** Set true only for the LCP hero image so it isn't lazy-loaded. */
  priority?: boolean;
  sizes?: string;
}

export function PlaceholderImage({
  slot,
  alt,
  width = 1280,
  height = 900,
  className = "",
  priority = false,
  sizes,
}: PlaceholderImageProps) {
  return (
    <Image
      src={SLOTS[slot]}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      // Everything but the hero lazy-loads by default (Next handles this).
      loading={priority ? undefined : "lazy"}
      sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
      className={className}
    />
  );
}
