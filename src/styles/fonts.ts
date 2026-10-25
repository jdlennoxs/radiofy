import { DM_Sans, Fraunces } from "next/font/google";

/**
 * Fraunces: a warm, slightly wonky display serif — headings and the wordmark.
 * DM Sans: clean geometric sans for UI and body copy.
 *
 * Self-hosted by next/font at build time; exposes CSS variables that Tailwind
 * maps to `font-display` / `font-sans`.
 */
export const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["opsz", "SOFT", "WONK"],
});

export const body = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});
