import type { Customer } from "./model";

export type CardLocation = {
  address: string;
  regionCode: string;
  demo?: boolean;
};
export type Region = {
  code: string;
  parent: string;
  level: number;
  name: string;
  fullName: string;
  bounds: [number, number, number, number];
  center: [number, number];
};
export type MapIndex = { version: string; source: string; regions: Region[] };
export type MapShape = { code: string; path: string };
export const sampleLocations: Record<string, CardLocation> = {
  nova: {
    address: "서울특별시 강남구 테헤란로 152 (역삼동)",
    regionCode: "1168064000",
    demo: true,
  },
  green: {
    address: "경기도 성남시 분당구 판교역로 235 (삼평동)",
    regionCode: "4113565500",
    demo: true,
  },
  bloom: {
    address: "부산광역시 해운대구 해운대로 570 (우동)",
    regionCode: "2635051000",
    demo: true,
  },
  atlas: {
    address: "대전광역시 유성구 테크노중앙로 55 (관평동)",
    regionCode: "3020060000",
    demo: true,
  },
};
export function cardLocation(customer: Customer): CardLocation | null {
  return customer.location === undefined
    ? sampleLocations[customer.id] || null
    : customer.location;
}
export function regionTrail(code: string, regions: Region[]): Region[] {
  const result: Region[] = [];
  let current = regions.find((r) => r.code === code);
  while (current && !result.some((r) => r.code === current!.code)) {
    result.unshift(current);
    current = regions.find((r) => r.code === current!.parent);
  }
  return result;
}
export function withinRegion(code: string, parent: string, regions: Region[]) {
  return (
    parent === "kr" || regionTrail(code, regions).some((r) => r.code === parent)
  );
}
const normalize = (s: string) => s.replace(/\s/g, "").replace(/제(?=\d)/g, "");
const provinceAliases: Record<string, string[]> = {
  "11": ["서울"],
  "26": ["부산"],
  "27": ["대구"],
  "28": ["인천"],
  "30": ["대전"],
  "31": ["울산"],
  "36": ["세종"],
  "41": ["경기"],
  "51": ["강원"],
  "43": ["충북", "충청북도"],
  "44": ["충남", "충청남도"],
  "52": ["전북", "전라북도"],
  "47": ["경북", "경상북도"],
  "48": ["경남", "경상남도"],
  "50": ["제주"],
};
// Resolve only unambiguous administrative names. Road names and legal-dong names need confirmation.
export function matchAddress(
  address: string,
  regions: Region[],
): Region | undefined {
  const text = normalize(address);
  if (!text) return;
  const provinces = new Set(
    regions
      .filter(
        (r) =>
          r.level === 1 &&
          (text.startsWith(normalize(r.name)) ||
            (provinceAliases[r.code] || []).some((alias) =>
              text.startsWith(alias),
            )),
      )
      .map((r) => r.code),
  );
  const districts = new Set(
    regions
      .filter(
        (r) =>
          r.level === 2 &&
          provinces.has(r.parent) &&
          text.includes(normalize(r.name)),
      )
      .map((r) => r.code),
  );
  const matches = regions.filter(
    (r) =>
      r.level === 3 &&
      districts.has(r.parent) &&
      text.includes(normalize(r.name)),
  );
  return matches.length === 1 ? matches[0] : undefined;
}
export function customerRegion(
  customer: Customer,
  regions: Region[],
): Region | undefined {
  const location = cardLocation(customer);
  if (!location) return;
  return (
    regions.find((r) => r.code === location.regionCode && r.level === 3) ||
    matchAddress(location.address, regions)
  );
}
let indexPromise: Promise<MapIndex> | undefined;
export function loadMapIndex() {
  return (indexPromise ||= fetch("/maps/regions.json")
    .then((r) => {
      if (!r.ok) throw new Error("지역 정보를 불러오지 못했어요.");
      return r.json() as Promise<MapIndex>;
    })
    .catch((e) => {
      indexPromise = undefined;
      throw e;
    }));
}
const shapeCache = new Map<string, Promise<MapShape[]>>();
export function loadShapes(parent: string) {
  if (!shapeCache.has(parent))
    shapeCache.set(
      parent,
      fetch(`/maps/${parent}.json`)
        .then((r) => {
          if (!r.ok) throw new Error("지도를 불러오지 못했어요.");
          return r.json() as Promise<MapShape[]>;
        })
        .catch((e) => {
          shapeCache.delete(parent);
          throw e;
        }),
    );
  return shapeCache.get(parent)!;
}
