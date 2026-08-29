export const BRAND = {
  name: "Arwias Collection",
  initials: "AC",
  tagline: "Stitching inventory",
  description:
    "Assign stitching work, track completed pieces, and print handover receipts for Arwias Collection.",
} as const;

export function pageTitle(segment?: string) {
  return segment ? `${segment} · ${BRAND.name}` : BRAND.name;
}
