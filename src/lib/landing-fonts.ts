import { Fraunces } from "next/font/google";

/** Display serif for public site (scoped via `.site-typography` on SiteLayout). */
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
});
