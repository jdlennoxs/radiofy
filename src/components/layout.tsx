import type { ReactNode } from "react";
import Header from "./Header";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-100 text-forest-900 antialiased">
      <Header />
      <main className="pt-16">{children}</main>
    </div>
  );
}
