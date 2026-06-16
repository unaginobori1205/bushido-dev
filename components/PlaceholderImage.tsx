import Image from "next/image";

/**
 * Named image slots. Slots that have real photography point at the dropped-in
 * file (.jpg); slots still awaiting a real photo point at the generated
 * /public/images/<slot>.svg placeholder.
 *
 * TODO(assets): As real photos arrive, point the slot at the new file here.
 * Provided photos (commit to /public/images with these exact names):
 *   hero.jpg     — kyudo dojo, group lesson (wide)            ✅ wired
 *   kyudo.jpg    — kyudo one-on-one instruction               ✅ wired
 *   zen.jpg      — seated meditation, Honmaru Palace           ✅ wired
 *   shrine.jpg   — couple in wedding kimono at a shrine        ✅ wired
 *   samurai.jpg  — samurai armor at Nagoya Castle              ✅ wired (Corporates)
 * Still placeholders (awaiting real photos): tea, calligraphy, founder.
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
  zen: "/images/zen.jpg",
  shrine: "/images/shrine.jpg",
  samurai: "/images/samurai.jpg",
  // Awaiting real photography — elegant generated placeholders for now.
  tea: "/images/tea.svg",
  calligraphy: "/images/calligraphy.svg",
  founder: "/images/founder.svg",
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
