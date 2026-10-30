#!/usr/bin/env python3
"""QA otomatis repo JASA (docs/16-qa-qc.md §A). Keluar dengan kode 1 jika ada cek gagal."""
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import hitung  # noqa: E402

GAGAL = []

# Plan single-user / terlarang untuk patungan (docs/06-legal-risiko.md, docs/09 §10)
PLAN_TERLARANG = ["claude", "chatgpt", "cursor", "perplexity", "gemini", "midjourney", "copilot",
                  "codex", "grok", "onlyfans", "fansly", "airwallex", "capcut"]

POLA_RAHASIA = [
    (re.compile(r"(?i)\b(password|passwd|sandi)\s*[:=]\s*\S{4,}"), "password tertulis"),
    (re.compile(r"\b(?:\d[ -]?){15}\d\b"), "angka 16 digit (kartu/NIK)"),
    (re.compile(r"(?i)\b(sk-[a-z0-9_-]{20,}|ghp_[a-z0-9]{20,}|xox[bp]-[a-z0-9-]{10,})"), "API key/token"),
]
LEWATI_RAHASIA = {"scripts/qa_check.py"}


def cek(kondisi, pesan):
    if not kondisi:
        GAGAL.append(pesan)


def muat_json():
    data = {}
    for p in [*ROOT.glob("site/*.json"), *ROOT.glob("config/*.json"), *ROOT.glob("data/*.json")]:
        try:
            data[p.relative_to(ROOT).as_posix()] = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            GAGAL.append(f"JSON tidak valid: {p.relative_to(ROOT)} ({e})")
    return data


def cek_katalog(katalog):
    kode_dipakai = set()
    for lay in katalog.get("produk", []):
        for f in ("id", "nama", "kategori", "akses", "aturan", "paket"):
            cek(f in lay, f"katalog: layanan {lay.get('id', '?')} tanpa field '{f}'")
        lid = str(lay.get("id", "")).lower()
        cek(not any(t in lid for t in PLAN_TERLARANG), f"katalog: '{lid}' termasuk plan terlarang untuk patungan")
        for pk in lay.get("paket", []):
            for f in ("kode", "slot", "periode", "harga_plan_resmi", "harga_per_slot", "slot_tersedia"):
                cek(f in pk, f"katalog: paket {pk.get('kode', '?')} tanpa field '{f}'")
            if not all(f in pk for f in ("kode", "slot", "periode", "harga_plan_resmi", "harga_per_slot", "slot_tersedia")):
                continue
            cek(pk["kode"] not in kode_dipakai, f"katalog: kode paket ganda {pk['kode']}")
            kode_dipakai.add(pk["kode"])
            cek(pk["periode"] in ("bulanan", "tahunan"), f"katalog: periode salah di {pk['kode']}")
            harapan = hitung.harga_per_slot(pk["harga_plan_resmi"], pk["slot"])
            cek(pk["harga_per_slot"] == harapan,
                f"katalog: {pk['kode']} harga_per_slot {pk['harga_per_slot']} ≠ {harapan} (plan/slot dibulatkan ribuan)")
            cek(0 <= pk["slot_tersedia"] <= pk["slot"], f"katalog: {pk['kode']} slot_tersedia di luar 0..slot")


def cek_fee():
    # Contoh resmi joinbareng (artikel bantuan biaya & S&K)
    cek(hitung.fee_patungan(46500, "bulanan") == 12650, "fee: contoh Netflix Rp46.500 harus fee joiner Rp12.650")
    cek(hitung.fee_patungan(50000, "bulanan") == 13000, "fee: patungan bulanan Rp50.000 harus fee Rp13.000")
    cek(hitung.fee_patungan(600000, "tahunan") == 12 * 16500, "fee: tahunan = (20% harga/bulan + Rp6.500) × 12")
    cek(hitung.fee_host(46500, "bulanan") == 5000, "fee: connection fee host bulanan maks Rp5.000")
    cek(hitung.fee_host(15000, "bulanan") == 3750, "fee: connection fee host 25% bila < maks")
    cek(hitung.fee_host(600000, "tahunan") == 6000, "fee: connection fee host tahunan maks Rp6.000")
    cek(hitung.fee_host(46500, "bulanan", pribadi=True) == 0, "fee: berbagi pribadi tanpa connection fee")
    kurs = 16000
    cek(hitung.jasa_bayar(69, kurs)["fee"] == 50000, "fee: jasa bayar $69 harus Rp50.000 flat")
    for usd, persen in ((70, 0.04), (500, 0.04), (501, 0.035)):
        r = hitung.jasa_bayar(usd, kurs)
        cek(r["fee"] == int(round(r["harga_rp"] * persen)), f"fee: jasa bayar ${usd} harus {persen * 100:g}%")
    cek(math.isclose(hitung.jasa_bayar(10, 10000)["kurs_jual"], 10150), "fee: spread kurs harus 1,5%")


def cek_referensi():
    teks = ""
    for p in [ROOT / "CLAUDE.md", ROOT / "README.md", *ROOT.glob("docs/*.md"), *ROOT.glob(".claude/skills/*/SKILL.md")]:
        teks += p.read_text(encoding="utf-8") + "\n"
    for ref in sorted(set(re.findall(r"`((?:docs|scripts|config|data|site|templates)/[\w./-]+\.(?:md|py|json|html))`", teks))):
        cek((ROOT / ref).exists(), f"referensi: {ref} disebut tapi tidak ada")
    for nama in re.findall(r"skill `([\w-]+)`", teks):
        cek((ROOT / ".claude/skills" / nama / "SKILL.md").exists(), f"referensi: skill `{nama}` tidak ada")
    for p in ROOT.glob(".claude/skills/*/SKILL.md"):
        kepala = p.read_text(encoding="utf-8").split("---")
        cek(len(kepala) >= 3 and "name:" in kepala[1] and "description:" in kepala[1],
            f"skill: {p.parent.name} tanpa frontmatter name/description")


def cek_rahasia():
    for p in ROOT.rglob("*"):
        rel = p.relative_to(ROOT).as_posix()
        if not p.is_file() or rel.startswith(".git/") or rel in LEWATI_RAHASIA or p.suffix not in {".md", ".json", ".html", ".py", ".yml", ".txt", ".ts", ".tsx", ".mjs", ".prisma"} or "node_modules" in rel:
            continue
        isi = p.read_text(encoding="utf-8", errors="ignore")
        for pola, label in POLA_RAHASIA:
            for m in pola.finditer(isi):
                angka = re.sub(r"\D", "", m.group(0))
                if label.startswith("angka") and angka.startswith("1100360"):  # ID ClickUp
                    continue
                GAGAL.append(f"rahasia: {label} di {rel}")


def main():
    data = muat_json()
    if "site/produk.json" in data:
        cek_katalog(data["site/produk.json"])
    cek_fee()
    cek_referensi()
    cek_rahasia()
    if GAGAL:
        print("QA GAGAL:")
        for g in GAGAL:
            print(" -", g)
        return 1
    print("SEMUA CEK LULUS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
