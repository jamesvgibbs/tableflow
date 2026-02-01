import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Seatherder - AI Event Seating Software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://seatherder.com";
  const heroUrl = `${baseUrl}/hero-dog.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
          gap: "48px",
        }}
      >
        {/* Dog mascot */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroUrl}
          alt="Seatherder mascot"
          width={280}
          height={280}
          style={{
            borderRadius: "24px",
          }}
        />

        {/* Text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          {/* Brand name */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#6700D9",
              marginBottom: "12px",
              letterSpacing: "-2px",
            }}
          >
            Seatherder
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: 600,
              color: "#1a1a2e",
              marginBottom: "16px",
            }}
          >
            AI Event Seating Software
          </div>

          {/* Value prop */}
          <div
            style={{
              fontSize: "24px",
              color: "#64748b",
            }}
          >
            Seat your event in minutes, not hours.
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "24px",
              padding: "12px 20px",
              borderRadius: "999px",
              backgroundColor: "#f0f1ff",
              color: "#6700D9",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            <span>🐾</span>
            <span>Smart event seating</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
