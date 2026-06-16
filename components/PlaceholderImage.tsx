import Image from "next/image";

/**
 * Named image slots. Each maps to /public/images/<slot>.svg today.
 *
 * TODO(assets): Drop real photography into /public/images using these exact
 * keys (e.g. hero.jpg) and update `SLOTS` below to point at the new file.
 */
export type ImageSlot =
  | "hero"
  | "kyudo"
  | "tea"
  | "calligraphy"
  | "zen"
  | "shrine"
  | "founder"
  | "sakura";

const SLOTS: Record<ImageSlot, string> = {
  hero: "/images/hero.svg",
  kyudo: "/images/kyudo.svg",
  tea: "/images/tea.svg",
  calligraphy: "/images/calligraphy.svg",
  zen: "/images/zen.svg",
  shrine: "/images/shrine.svg",
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
