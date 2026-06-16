// Reuse the same composition for the Twitter card. `runtime` must be declared
// locally (Next can't trace a re-exported runtime field).
export const runtime = "edge";
export const alt =
  "BUSHIDO AI — The Cultural Intelligence Platform for Authentic Japan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export { default } from "./opengraph-image";
