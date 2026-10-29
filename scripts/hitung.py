#!/usr/bin/env python3
"""Kalkulator fee JASA (angka dari config/fee.json, disamakan dengan joinbareng).

Pakai:
  python3 scripts/hitung.py patungan <harga_per_slot> [bulanan|tahunan]
  python3 scripts/hitung.py slot <harga_plan_resmi> <jumlah_slot>
  python3 scripts/hitung.py jasa-bayar <harga_usd> <kurs_mid_market>
  python3 scripts/hitung.py seller <total_pesanan>
"""
import json
import math
import sys
from pathlib import Path

FEE = json.loads((Path(__file__).resolve().parent.parent / "config" / "fee.json").read_text())


def ribuan(x: float) -> int:
    """Bulatkan ke atas ke kelipatan Rp1.000."""
    return int(math.ceil(round(x, 6) / 1000.0) * 1000)


def fee_patungan(harga_per_slot: int, periode: str = "bulanan") -> int:
    f = FEE["patungan"][periode]
    return int(round(harga_per_slot * f["persen"] + f["tetap"]))


def harga_per_slot(harga_plan: int, slot: int) -> int:
    return ribuan(harga_plan / slot)


def fee_jasa_bayar(usd: float, harga_rp: float) -> int:
    for t in FEE["jasa_bayar"]["tier"]:
        if t["maks_usd"] is None or usd < t["maks_usd"] or (t["tipe"] == "persen" and usd <= t["maks_usd"]):
            return int(t["nilai"]) if t["tipe"] == "flat" else int(round(harga_rp * t["nilai"]))
    raise ValueError("tier fee jasa bayar tidak ditemukan")


def jasa_bayar(usd: float, kurs_mid: float) -> dict:
    kurs_jual = kurs_mid * (1 + FEE["jasa_bayar"]["spread_kurs"])
    harga_rp = usd * kurs_jual
    fee = fee_jasa_bayar(usd, harga_rp)
    return {"kurs_jual": round(kurs_jual, 2), "harga_rp": int(round(harga_rp)), "fee": fee,
            "total": ribuan(harga_rp + fee)}


def fee_seller(total: int) -> int:
    m = FEE["marketplace"]
    return max(m["fee_seller_min"], int(round(total * m["fee_seller_persen"])))


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 1
    mode = argv[1]
    if mode == "patungan":
        harga = int(argv[2]); periode = argv[3] if len(argv) > 3 else "bulanan"
        fee = fee_patungan(harga, periode)
        print(f"harga/slot Rp{harga:,} + fee Rp{fee:,} = bayar Rp{harga + fee:,} ({periode})".replace(",", "."))
    elif mode == "slot":
        print(f"harga per slot Rp{harga_per_slot(int(argv[2]), int(argv[3])):,}".replace(",", "."))
    elif mode == "jasa-bayar":
        r = jasa_bayar(float(argv[2]), float(argv[3]))
        print(f"kurs jual {r['kurs_jual']} | harga Rp{r['harga_rp']:,} | fee Rp{r['fee']:,} | total Rp{r['total']:,}".replace(",", "."))
    elif mode == "seller":
        t = int(argv[2]); f = fee_seller(t)
        print(f"fee seller Rp{f:,} | diterima seller Rp{t - f:,}".replace(",", "."))
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
