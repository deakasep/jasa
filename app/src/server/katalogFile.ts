/** Baca katalog patungan dari ../site/produk.json (sumber kebenaran katalog; database di-seed dari file yang sama). */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Katalog } from "../domain/katalog.ts";

export function muatKatalog(lokasi = process.env.KATALOG_PATH ?? path.resolve(process.cwd(), "..", "site", "produk.json")): Katalog {
  return JSON.parse(readFileSync(lokasi, "utf8")) as Katalog;
}
