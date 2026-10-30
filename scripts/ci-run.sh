#!/usr/bin/env bash
# Jalankan perintah CI; bila gagal, tampilkan 20 baris terakhir output sebagai anotasi GitHub (::error::)
# supaya penyebabnya terbaca langsung di halaman PR/Actions tanpa membuka log mentah.
# Pakai: bash ../scripts/ci-run.sh "Label" perintah arg...
set -uo pipefail
label="$1"; shift
log="$(mktemp)"
"$@" 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
if [ "$status" -ne 0 ]; then
  tail -n 20 "$log" | sed -e 's/%/%25/g' -e 's/\r/%0D/g' | while IFS= read -r baris; do
    [ -n "$baris" ] && echo "::error title=${label}::${baris}"
  done
fi
rm -f "$log"
exit "$status"
