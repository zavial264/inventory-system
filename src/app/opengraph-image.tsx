import { ImageResponse } from "next/og";

import { BRAND } from "@/lib/brand";

export const alt = BRAND.name;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "linear-gradient(145deg, #1c1917 0%, #44403c 52%, #78716c 100%)",
          color: "#fafaf9",
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textAlign: "center",
          }}
        >
          {BRAND.name}
        </div>
      </div>
    ),
    { ...size },
  );
}
