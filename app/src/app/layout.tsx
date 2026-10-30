import type { ReactNode } from "react";

export const metadata = {
  title: "JASA — Patungan, Jasa Bayar & Marketplace Digital",
  description: "Langganan premium patungan, bayar layanan luar negeri pakai Rupiah, dan belanja digital aman dengan escrow.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
