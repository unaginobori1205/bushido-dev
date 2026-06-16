/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // TODO: When you host real photography on a CDN, whitelist the domain here
    // so you can pass remote URLs straight to <Image src="https://..." />.
    // remotePatterns: [{ protocol: "https", hostname: "cdn.bushido.ai" }],
    formats: ["image/avif", "image/webp"],
    // The shipped /public/images/*.svg files are placeholders. Once you drop in
    // real .jpg/.webp photography you can remove this flag.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
