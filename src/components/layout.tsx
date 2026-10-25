import type { ReactNode } from "react";
import { body, display } from "../styles/fonts";
import Header from "./Header";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${body.variable} ${display.variable} min-h-screen bg-gradient-to-b from-cream-100 via-cream-50 to-sage-100 font-sans text-forest-900 antialiased`}
    >
      <Header />
      <main className="pt-16">{children}</main>
    </div>
  );
}
