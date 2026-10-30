#!/usr/bin/env python3
"""Kalkulator fee JASA (angka dari config/fee.json, disamakan dengan joinbareng).

Pakai:
  python3 scripts/hitung.py patungan <harga_slot> [bulanan|tahunan]   # tahunan: harga slot per TAHUN
  python3 scripts/hitung.py host <harga_slot> [bulanan|tahunan]       # connection fee host (bulan pertama/joiner)
  python3 scripts/hitung.py slot <harga_plan_resmi> <jumlah_slot>
  python3 scripts/hitung.py jasa-bayar <harga_usd> <kurs_mid_market>
  python3 scripts/hitung.py seller <total_pesanan>
  python3 scripts/hitung.py pendapatan                                 # tabel % pendapatan dari pembeli & penjual
"""
import json
import math
import sys
from pathlib import Path

FEE = json.loads((Path(__file__).resolve().parent.parent / "config" / "fee.json").read_text())


def ribuan(x: float) -> int:
    """Bulatkan ke atas ke kelipatan Rp1.000."""
    return int(math.ceil(round(x, 6) / 1000.0) * 1000)


def rp(n: float) -> str:
    return f"Rp{int(round(n)):,}".replace(",", ".")


def fee_patungan(harga_slot: int, periode: str = "bulanan") -> int:
    """Fee joiner. Bulanan: harga_slot per bulan. Tahunan: harga_slot per tahun, fee dihitung per bulan × 12."""
    f = FEE["patungan"][periode]
    if periode == "bulanan":
        return int(round(harga_slot * f["persen"] + f["tetap"]))
    return int(round(harga_slot * f["persen"] + 12 * f["tetap"]))


def fee_host(harga_slot: int, periode: str = "bulanan", pribadi: bool = False) -> int:
    """Connection fee host: hanya bulan pertama per joiner baru; berbagi pribadi = 0."""
    if pribadi and FEE["patungan_host"]["pribadi_bebas_connection_fee"]:
        return 0
    f = FEE["patungan_host"][periode]
    return int(min(round(harga_slot * f["persen"]), f["maks"]))


def harga_per_slot(harga_plan: int, slot: int) -> int:
    return ribuan(harga_plan / slot)


def fee_jasa_bayar(usd: float, harga_rp: float) -> int:
    for t in FEE["jasa_bayar"]["tier"]:
        batas = t["maks_usd"]
        cocok = batas is None or (usd < batas if t["tipe"] == "flat" else usd <= batas)
        if cocok:
            return int(t["nilai"]) if t["tipe"] == "flat" else int(round(harga_rp * t["nilai"]))
    raise ValueError("tier fee jasa bayar tidak ditemukan")


def jasa_bayar(usd: float, kurs_mid: float) -> dict:
    kurs_jual = kurs_mid * (1 + FEE["jasa_bayar"]["spread_kurs"])
    harga_rp = usd * kurs_jual
    fee = fee_jasa_bayar(usd, harga_rp)
    return {"kurs_jual": round(kurs_jual, 2), "harga_rp": int(round(harga_rp)), "fee": fee,
            "spread_rp": int(round(harga_rp - usd * kurs_mid)), "total": ribuan(harga_rp + fee)}


def fee_seller(total: int) -> int:
    m = FEE["marketplace"]
    return max(m["fee_seller_min"], int(round(total * m["fee_seller_persen"])))


def biaya_qris(nominal: int) -> int:
    g = FEE["biaya_gateway_estimasi"]["qris"]
    return int(round(nominal * g["persen"] + g["tetap"]))


def pendapatan():
    """Tabel persen pendapatan kita dari pembeli & penjual (bruto dan setelah estimasi biaya QRIS)."""
    baris = []
    for harga in (15000, 28000, 47000, 100000):
        fee = fee_patungan(harga, "bulanan"); total = harga + fee
        baris.append(("Patungan bulanan", f"slot {rp(harga)}", "pembeli", fee, total, fee - biaya_qris(total)))
    for harga in (140000, 600000):
        fee = fee_patungan(harga, "tahunan"); total = harga + fee
        baris.append(("Patungan tahunan", f"slot {rp(harga)}/th", "pembeli", fee, total, fee - biaya_qris(total)))
    for harga in (15000, 47000):
        fee = fee_host(harga, "bulanan")
        baris.append(("Host patungan", f"slot {rp(harga)} bln-1", "penjual", fee, harga, fee))
    kurs = 16500
    for usd in (20, 100, 200, 600):
        r = jasa_bayar(usd, kurs); untung = r["fee"] + r["spread_rp"]
        baris.append(("Jasa Bayar", f"US${usd}", "pembeli", untung, r["total"], untung - biaya_qris(r["total"])))
    for total in (13000, 50000, 200000):
        f = fee_seller(total)
        baris.append(("Marketplace", f"pesanan {rp(total)}", "penjual", f, total, f - biaya_qris(total)))
    print(f"{'Pilar':<17}{'Contoh':<22}{'Dari':<9}{'Pendapatan':>12}{'%':>8}{'Bersih*':>10}{'% bersih':>10}")
    for pilar, contoh, dari, untung, total, bersih in baris:
        print(f"{pilar:<17}{contoh:<22}{dari:<9}{rp(untung):>12}{untung / total:>8.1%}{rp(bersih):>10}{bersih / total:>10.1%}")
    print("* bersih = setelah estimasi biaya QRIS (config/fee.json → biaya_gateway_estimasi); host: dipotong dari payout, tanpa biaya QRIS tambahan.")
    print("  Connection fee host hanya bulan pertama per joiner baru; bulan berikutnya 0%. Belum termasuk pajak & biaya FX kartu jasa bayar.")


def main(argv):
    if len(argv) >= 2 and argv[1] == "pendapatan":
        pendapatan(); return 0
    if len(argv) < 3:
        print(__doc__); return 1
    mode = argv[1]
    if mode == "patungan":
        harga = int(argv[2]); periode = argv[3] if len(argv) > 3 else "bulanan"
        fee = fee_patungan(harga, periode)
        print(f"harga slot {rp(harga)} + fee {rp(fee)} = bayar {rp(harga + fee)} ({periode})")
    elif mode == "host":
        harga = int(argv[2]); periode = argv[3] if len(argv) > 3 else "bulanan"
        fee = fee_host(harga, periode)
        print(f"connection fee {rp(fee)} → host terima {rp(harga - fee)} bulan pertama, {rp(harga)} bulan berikutnya ({periode})")
    elif mode == "slot":
        print(f"harga per slot {rp(harga_per_slot(int(argv[2]), int(argv[3])))}")
    elif mode == "jasa-bayar":
        r = jasa_bayar(float(argv[2]), float(argv[3]))
        print(f"kurs jual {r['kurs_jual']} | harga {rp(r['harga_rp'])} | fee {rp(r['fee'])} | total {rp(r['total'])}")
    elif mode == "seller":
        t = int(argv[2]); f = fee_seller(t)
        print(f"fee seller {rp(f)} | diterima seller {rp(t - f)}")
    else:
        print(__doc__); return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
