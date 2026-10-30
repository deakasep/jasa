// Tampilan sementara. Desain web dibuat terakhir (keputusan pemilik) — halaman ini hanya penanda bahwa backend hidup.
export default function Beranda() {
  return (
    <main style={{ maxWidth: 640, margin: "48px auto", padding: "0 16px", lineHeight: 1.6 }}>
      <h1>JASA</h1>
      <p>Patungan langganan premium, jasa bayar layanan luar negeri, dan marketplace digital dengan escrow.</p>
      <p>
        Cek harga: <code>/api/quote?jenis=patungan&amp;harga=46500&amp;periode=bulanan</code>
      </p>
    </main>
  );
}
