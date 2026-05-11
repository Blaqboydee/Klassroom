import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Klassroom";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
        }}
      >
        {/* K badge */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            backgroundColor: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 700, color: "#fff" }}>K</span>
        </div>

        <div style={{ fontSize: 64, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          Klassroom
        </div>
        <div style={{ fontSize: 28, color: "#94a3b8", textAlign: "center", maxWidth: 700 }}>
          Track assignments, streaks &amp; submissions — all in one place.
        </div>
      </div>
    ),
    size
  );
}
