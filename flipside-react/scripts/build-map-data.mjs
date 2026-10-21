// Rebuild with: node scripts/build-map-data.mjs (public data only; no API key).
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import polylabel from "polylabel";

const revision = "3bc00489b76696db864bdbea4b19985cdfa8b403";
const source = `https://raw.githubusercontent.com/vuski/admdongkor/${revision}/ver20261001/HangJeongDong_ver20261001.geojson`;
await fs.mkdir("tmp/maps", { recursive: true });
await fs.mkdir("public/maps", { recursive: true });
try {
  await fs.access("tmp/maps/source.geojson");
} catch {
  const response = await fetch(source);
  if (!response.ok)
    throw new Error(`Boundary download failed: ${response.status}`);
  await fs.writeFile("tmp/maps/source.geojson", await response.text());
}
execFileSync(
  process.execPath,
  [
    "node_modules/mapshaper/bin/mapshaper",
    "tmp/maps/source.geojson",
    "-simplify",
    "8%",
    "keep-shapes",
    "-o",
    "tmp/maps/dong.geojson",
    "format=geojson",
    "precision=0.00001",
    "force",
    "-dissolve",
    "sgg",
    "copy-fields=sido,sidonm,sggnm",
    "-o",
    "tmp/maps/district.geojson",
    "format=geojson",
    "precision=0.00001",
    "force",
    "-dissolve",
    "sido",
    "copy-fields=sidonm",
    "-o",
    "tmp/maps/province.geojson",
    "format=geojson",
    "precision=0.00001",
    "force",
  ],
  { stdio: "inherit" },
);

const project = ([lon, lat]) => [
  +(1000 * (lon - 124) * Math.cos((36 * Math.PI) / 180)).toFixed(2),
  +(1000 * (39 - lat)).toFixed(2),
];
const area = (ring) =>
  Math.abs(
    ring.reduce((sum, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0),
  );
const groups = {},
  regions = [];
for (const [file, level] of [
  ["province", 1],
  ["district", 2],
  ["dong", 3],
]) {
  const collection = JSON.parse(
    await fs.readFile(`tmp/maps/${file}.geojson`, "utf8"),
  );
  for (const feature of collection.features) {
    const p = feature.properties;
    const code = level === 1 ? p.sido : level === 2 ? p.sgg : p.adm_cd2;
    const parent = level === 1 ? "kr" : level === 2 ? p.sido : p.sgg;
    const name =
      level === 1
        ? p.sidonm
        : level === 2
          ? p.sggnm.replace(/시(?=.+구$)/, "시 ")
          : p.adm_nm.split(" ").at(-1);
    const fullName =
      level === 1
        ? name
        : level === 2
          ? `${p.sidonm} ${name}`
          : p.adm_nm.replace(/시(?=[가-힣]+구 )/, "시 ");
    const polygons = (
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates
    ).map((poly) => poly.map((ring) => ring.map(project)));
    const points = polygons.flat(2);
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    const x = Math.min(...xs),
      y = Math.min(...ys);
    const bounds = [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
    const largest = polygons.toSorted((a, b) => area(b[0]) - area(a[0]))[0];
    const center = polylabel(largest, 0.1)
      .slice(0, 2)
      .map((v) => +v.toFixed(2));
    const region = { code, parent, level, name, fullName, bounds, center };
    const path = polygons
      .map((poly) =>
        poly
          .map((ring) => "M" + ring.map((p) => p.join(",")).join("L") + "Z")
          .join(""),
      )
      .join("");
    regions.push(region);
    (groups[parent] ||= []).push({ code, path });
  }
}
for (const [parent, shapes] of Object.entries(groups)) {
  await fs.writeFile(`public/maps/${parent}.json`, JSON.stringify(shapes));
}
await fs.writeFile(
  "public/maps/regions.json",
  JSON.stringify({ version: "2026-10-01", source, regions }),
);
console.log(
  `Built ${regions.length} regions in ${Object.keys(groups).length} lazy-loaded map groups.`,
);
