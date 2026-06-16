import { ImageResponse } from "next/og";

// Static social-share card generated at build time. 1200x630 is the standard
// OG / Twitter large-image size.
export const runtime = "edge";
export const alt =
  "BUSHIDO AI — The Cultural Intelligence Platform for Authentic Japan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0A1320 0%, #0F1B2D 55%, #0A1320 100%)",
          padding: "72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#C9A24B",
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "3px solid #C9A24B",
              display: "flex",
            }}
          />
          BUSHIDO AI
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#F4ECDD",
          }}
        >
          <div style={{ fontSize: 64, lineHeight: 1.1, maxWidth: 980 }}>
            The Cultural Intelligence Platform for Authentic Japan
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: "#C9A24B",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            Not a tour agency. A cultural experience OS.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
