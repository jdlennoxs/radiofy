import type { ReactNode } from "react";
import Header from "./Header";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <Header />
      <main className="pt-16">{children}</main>
    </div>
  );
}
