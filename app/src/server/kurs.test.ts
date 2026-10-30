import { test } from "node:test";
import assert from "node:assert/strict";
import { ambilKandidatKurs, bacaErApi, bacaFrankfurter, SUMBER_KURS, type FetchJson } from "./kurs.ts";

test("baca format Frankfurter & open.er-api", () => {
  assert.deepEqual(bacaFrankfurter({ amount: 1, base: "USD", date: "2026-10-29", rates: { IDR: 16512.3 } }),
    { sumber: "frankfurter", nilai: 16512.3, waktu: new Date("2026-10-29T15:00:00Z") });
  assert.equal(bacaErApi({ result: "success", time_last_update_unix: 1793318401, rates: { IDR: 16520 } }).nilai, 16520);
  assert.throws(() => bacaErApi({ result: "error" }), /format/);
  assert.throws(() => bacaFrankfurter({ rates: {} }), /format/);
});

test("satu sumber gagal tidak menggagalkan yang lain", async () => {
  const f: FetchJson = async (url) => url === SUMBER_KURS.frankfurter
    ? { ok: false, status: 503, json: async () => ({}) }
    : { ok: true, status: 200, json: async () => ({ result: "success", time_last_update_unix: 1793318401, rates: { IDR: 16520 } }) };
  const h = await ambilKandidatKurs(f);
  assert.equal(h.kandidat.length, 1);
  assert.equal(h.kandidat[0].sumber, "erapi");
  assert.deepEqual(h.error, ["frankfurter: HTTP 503"]);
});
