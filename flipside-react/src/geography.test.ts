import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  cardLocation,
  customerRegion,
  matchAddress,
  regionTrail,
  sampleLocations,
  withinRegion,
  type MapIndex,
} from "./geography";
import { initialState } from "./model";

const index: MapIndex = JSON.parse(
  fs.readFileSync(
    new URL("../public/maps/regions.json", import.meta.url),
    "utf8",
  ),
);
const regions = index.regions;
test("every administrative region is reachable and has a finite local boundary", () => {
  const codes = new Set(regions.map((r) => r.code));
  assert.equal(codes.size, regions.length);
  assert.ok(regions.filter((r) => r.level === 3).length > 3500);
  for (const parent of new Set(regions.map((r) => r.parent))) {
    const shapes = JSON.parse(
      fs.readFileSync(
        new URL(`../public/maps/${parent}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.deepEqual(
      new Set(shapes.map((s: { code: string }) => s.code)),
      new Set(regions.filter((r) => r.parent === parent).map((r) => r.code)),
    );
    assert.ok(
      shapes.every(
        (s: { path: string }) =>
          s.path.startsWith("M") && !/NaN|undefined|Infinity/.test(s.path),
      ),
    );
  }
  for (const region of regions) {
    assert.ok(region.parent === "kr" || codes.has(region.parent));
    assert.equal(regionTrail(region.code, regions).length, region.level);
    assert.ok([...region.bounds, ...region.center].every(Number.isFinite));
    assert.ok(region.bounds[2] > 0 && region.bounds[3] > 0);
  }
});
test("seed addresses work with old saved customers; explicit removal stays removed", () => {
  for (const c of initialState().customers) {
    assert.equal(
      customerRegion(c, regions)?.code,
      sampleLocations[c.id].regionCode,
    );
    assert.equal(cardLocation({ ...c, location: null }), null);
    assert.equal(customerRegion({ ...c, location: null }, regions), undefined);
    assert.equal(cardLocation({ ...c, id: "new-customer" }), null);
  }
});
test("region filtering handles provinces, compound districts, and leaf areas", () => {
  const code = sampleLocations.green.regionCode;
  assert.equal(withinRegion(code, "kr", regions), true);
  assert.equal(withinRegion(code, "41", regions), true);
  assert.equal(withinRegion(code, "41135", regions), true);
  assert.equal(withinRegion(code, code, regions), true);
  assert.equal(withinRegion(code, "11", regions), false);
  assert.equal(
    withinRegion(code, sampleLocations.nova.regionCode, regions),
    false,
  );
});
test("address matching resolves only explicit unambiguous administrative names", () => {
  assert.equal(
    matchAddress("서울 강남구 역삼1동 123", regions)?.code,
    sampleLocations.nova.regionCode,
  );
  assert.equal(
    matchAddress("경기도 성남시 분당구 삼평동 123", regions)?.code,
    sampleLocations.green.regionCode,
  );
  assert.equal(
    matchAddress("대전광역시 유성구 관평동 123", regions)?.code,
    sampleLocations.atlas.regionCode,
  );
  assert.equal(
    matchAddress("서울 강남구 테헤란로 152 (역삼동)", regions),
    undefined,
  );
  assert.equal(matchAddress("부산 해운대구 우동", regions), undefined);
  assert.equal(matchAddress("중구 중앙동", regions), undefined);
  assert.equal(matchAddress("서울 강남구 역삼1동 역삼2동", regions), undefined);
  assert.equal(matchAddress("", regions), undefined);
});
