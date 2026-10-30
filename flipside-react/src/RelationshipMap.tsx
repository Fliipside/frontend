import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Crosshair,
  MapPin,
  Minus,
  Network,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useStore } from "./store";
import { visibleRecords } from "./model";
import { Badge, Company, Empty } from "./ui";
import {
  cardLocation,
  customerRegion,
  loadMapIndex,
  loadShapes,
  regionTrail,
  withinRegion,
  type MapIndex,
  type MapShape,
  type Region,
} from "./geography";
import "./relationship-map.css";
import RelationshipGraph from "./RelationshipGraph";

export default function RelationshipMap({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { s, open } = useStore();
  const [index, setIndex] = useState<MapIndex>();
  const [shapes, setShapes] = useState<MapShape[]>([]);
  const [code, setCode] = useState("kr");
  const [query, setQuery] = useState("");
  const [unmapped, setUnmapped] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    loadMapIndex()
      .then((data) => {
        if (active) setIndex(data);
      })
      .catch(() => {
        if (active) {
          setError("지역 정보를 불러오지 못했어요. 다시 시도해주세요.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const regions = index?.regions || [];
  const current = regions.find((r) => r.code === code);
  const trail = regionTrail(code, regions);
  const group = current?.level === 3 ? current.parent : code;
  useEffect(() => {
    if (!index) return;
    let active = true;
    setLoading(true);
    setError("");
    setShapes([]);
    loadShapes(group)
      .then((data) => {
        if (active) {
          setShapes(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("지도 경계를 불러오지 못했어요. 다시 시도해주세요.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [group, index, retry]);
  const located = useMemo(
    () =>
      s.customers.map((customer) => ({
        customer,
        region: customerRegion(customer, regions),
      })),
    [s.customers, index],
  );
  const missing = located.filter((c) => !c.region);
  const matchesQuery = (text: string) =>
    text
      .replace(/\s/g, "")
      .toLowerCase()
      .includes(query.replace(/\s/g, "").toLowerCase());
  const scoped = located.filter(({ region }) =>
    unmapped ? !region : region && withinRegion(region.code, code, regions),
  );
  const customers = (query.trim() && !unmapped ? located : scoped).filter(
    ({ customer, region }) =>
      matchesQuery(
        `${customer.name} ${customer.person} ${cardLocation(customer)?.address || ""} ${region?.fullName || ""}`,
      ),
  );
  const searchRegions =
    query.trim().length >= 2
      ? regions.filter((r) => matchesQuery(r.fullName)).slice(0, 7)
      : [];
  const children = regions.filter((r) => r.parent === code);
  const visibleShapes = shapes.filter(
    (shape) => current?.level !== 3 || shape.code === code,
  );
  const mapRegions = visibleShapes
    .map((shape) => regions.find((r) => r.code === shape.code)!)
    .filter(Boolean);
  const countFor = (region: Region) =>
    located.filter(
      (c) => c.region && withinRegion(c.region.code, region.code, regions),
    ).length;
  const selected = customers.find((c) => c.customer.id === selectedId) || customers[0];
  const matchingId = selected?.customer.id || "";
  useEffect(() => {
    if (index && matchingId !== selectedId) onSelect(matchingId);
  }, [index, matchingId, selectedId, onSelect]);
  const searchLocation = query.trim() && customers.length === 1 ? selected?.region?.code : undefined;
  useEffect(() => {
    if (searchLocation && searchLocation !== code) {
      setCode(searchLocation);
      setZoom(1);
    }
  }, [searchLocation, code]);
  const minX = Math.min(...mapRegions.map((r) => r.bounds[0])),
    minY = Math.min(...mapRegions.map((r) => r.bounds[1]));
  const maxX = Math.max(...mapRegions.map((r) => r.bounds[0] + r.bounds[2])),
    maxY = Math.max(...mapRegions.map((r) => r.bounds[1] + r.bounds[3]));
  const scale = mapRegions.length
    ? Math.min(300 / Math.max(maxX - minX, 1), 290 / Math.max(maxY - minY, 1)) *
      zoom
    : 1;
  const tx = 210 - ((minX + maxX) / 2) * scale,
    ty = 230 - ((minY + maxY) / 2) * scale;
  const pos = (r: Region) => [
    r.center[0] * scale + tx,
    r.center[1] * scale + ty,
  ];
  const pins: {
    region: Region;
    x: number;
    y: number;
    sourceX: number;
    sourceY: number;
  }[] = [];
  for (const region of mapRegions.filter((r) => countFor(r) > 0)) {
    const [sourceX, sourceY] = pos(region);
    const offsets = [
      [0, 0],
      [-42, -18],
      [42, 18],
      [-48, 34],
      [48, -34],
      [0, -65],
      [0, 65],
    ];
    const [dx, dy] =
      offsets.find(([dx, dy]) =>
        pins.every(
          (pin) => Math.hypot(pin.x - sourceX - dx, pin.y - sourceY - dy) > 60,
        ),
      ) || offsets[0];
    pins.push({ region, x: sourceX + dx, y: sourceY + dy, sourceX, sourceY });
  }
  function navigate(next: string) {
    setCode(next);
    setZoom(1);
    setHovered("");
    setUnmapped(false);
    setQuery("");
  }
  function focusCustomer(id: string) {
    onSelect(id);
    const region = located.find((c) => c.customer.id === id)?.region;
    if (region) navigate(region.code);
  }
  return (
    <div className="relationship-unified">
      <section className="card geo-workspace">
        <div className="geo-toolbar">
          <div>
            <span className="eyebrow">FIND YOUR CONNECTION</span>
            <h2>지역·고객 탐색</h2>
          </div>
          <label className="geo-search">
            <Search size={17} />
            <input
              aria-label="지역·고객·명함 주소 검색"
              placeholder="지역, 고객, 명함 주소 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="검색 지우기" onClick={() => setQuery("")}>
                <X size={15} />
              </button>
            )}
          </label>
          <div className="geo-scope-controls" aria-label="고객 위치 필터">
            <button aria-pressed={!unmapped} onClick={() => { setUnmapped(false); setQuery(""); }}>지역의 고객</button>
            <button aria-pressed={unmapped} onClick={() => { setUnmapped(true); setQuery(""); }}>위치 미등록 <span>{missing.length}</span></button>
          </div>
        </div>
        {searchRegions.length > 0 && (
          <div className="geo-search-results" aria-label="지역 검색 결과">
            {searchRegions.map((r) => (
              <button key={r.code} onClick={() => navigate(r.code)}>
                <MapPin size={14} />
                {r.fullName}
                <ChevronRight size={13} />
              </button>
            ))}
          </div>
        )}
        <div className="geo-layout">
          <div className="geo-map-column">
            <nav className="geo-breadcrumb" aria-label="선택 지역">
              <button onClick={() => navigate("kr")}>대한민국</button>
              {trail.map((r) => (
                <span key={r.code}>
                  <ChevronRight size={13} />
                  <button
                    aria-current={r.code === code ? "location" : undefined}
                    onClick={() => navigate(r.code)}
                  >
                    {r.name}
                  </button>
                </span>
              ))}
            </nav>
            <div className="geo-map" aria-busy={loading}>
              <div className="geo-map-heading">
                <h3>{current?.name || "대한민국"}</h3>
                <p>
                  {current?.level === 3
                    ? "명함 주소가 속한 행정구역"
                    : `${current?.level === 2 ? "읍·면·동" : current?.level === 1 ? "시·군·구" : "시·도"}를 클릭해 관계를 살펴보세요`}
                </p>
              </div>
              <div className="geo-map-controls">
                <button
                  aria-label="지도 확대"
                  disabled={zoom >= 2}
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                >
                  <Plus size={17} />
                </button>
                <button
                  aria-label="지도 축소"
                  disabled={zoom <= 1}
                  onClick={() => setZoom(Math.max(1, zoom - 0.25))}
                >
                  <Minus size={17} />
                </button>
                <button
                  aria-label="현재 지역 전체 보기"
                  onClick={() => setZoom(1)}
                >
                  <Crosshair size={17} />
                </button>
                {current && (
                  <button
                    aria-label="상위 지역으로"
                    onClick={() => navigate(current.parent)}
                  >
                    <ArrowLeft size={17} />
                  </button>
                )}
              </div>
              {error ? (
                <div className="geo-loading" role="alert">
                  <p>{error}</p>
                  <button
                    className="btn"
                    onClick={() => setRetry((r) => r + 1)}
                  >
                    다시 시도
                  </button>
                </div>
              ) : loading ? (
                <div className="geo-loading" role="status">
                  지역 지도를 불러오고 있어요…
                </div>
              ) : (
                <svg
                  className="geo-svg"
                  viewBox="0 0 420 430"
                  aria-label={`${current?.fullName || "대한민국"} 고객 관계 지도`}
                >
                  <defs>
                    <linearGradient id="geo-land" x2=".7" y2="1">
                      <stop stopColor="#f8fbff" />
                      <stop offset="1" stopColor="#e4edf9" />
                    </linearGradient>
                    <linearGradient id="geo-active" x2=".8" y2="1">
                      <stop stopColor="#a8cbff" />
                      <stop offset="1" stopColor="#739ee3" />
                    </linearGradient>
                    <filter
                      id="geo-shadow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="150%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="5"
                        stdDeviation="5"
                        floodColor="#294d88"
                        floodOpacity=".14"
                      />
                    </filter>
                  </defs>
                  <g filter="url(#geo-shadow)">
                    {visibleShapes.map((shape) => {
                      const region = regions.find(
                        (r) => r.code === shape.code,
                      )!;
                      if (!region) return null;
                      const count = countFor(region);
                      return (
                        <path
                          key={shape.code}
                          d={shape.path}
                          transform={`translate(${tx} ${ty}) scale(${scale})`}
                          fillRule="evenodd"
                          vectorEffect="non-scaling-stroke"
                          className={`geo-region ${count ? "has-customers" : ""} ${hovered === region.name ? "hovered" : ""}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`${region.name} · 고객 ${count}곳`}
                          onClick={() => navigate(region.code)}
                          onMouseEnter={() => setHovered(region.name)}
                          onMouseLeave={() => setHovered("")}
                          onFocus={() => setHovered(region.name)}
                          onBlur={() => setHovered("")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate(region.code);
                            }
                          }}
                        >
                          <title>
                            {region.name} · 고객 {count}곳
                          </title>
                        </path>
                      );
                    })}
                  </g>
                  {mapRegions.map((region) => {
                    const pin = pins.find((p) => p.region.code === region.code);
                    const [x, y] = pin ? [pin.x, pin.y] : pos(region),
                      count = countFor(region);
                    if (x < 35 || x > 385 || y < 60 || y > 400) return null;
                    if (count)
                      return (
                        <g
                          key={region.code}
                          className={`geo-pin ${selected?.region && withinRegion(selected.region.code, region.code, regions) ? "selected" : ""}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`${region.name} 고객 ${count}곳 보기`}
                          onClick={() => navigate(region.code)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate(region.code);
                            }
                          }}
                          transform={`translate(${x} ${y})`}
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2={pin!.sourceX - x}
                            y2={pin!.sourceY - y}
                            stroke="#5b87c7"
                            strokeWidth="1.2"
                          />
                          <ellipse cy="19" rx="21" ry="6" fill="#285baf20" />
                          <circle r="22" fill="#fff" stroke="#d4e3fa" />
                          <circle r="17" fill="#2d63c8" />
                          <text
                            y="5"
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="14"
                            fontWeight="700"
                          >
                            {count}
                          </text>
                          <text
                            className="geo-region-name"
                            y="43"
                            textAnchor="middle"
                          >
                            {region.name}
                          </text>
                        </g>
                      );
                    const nearPin = pins.some(
                      (p) =>
                        Math.abs(p.x - x) < 65 && Math.abs(p.y + 12 - y) < 48,
                    );
                    return (
                      <text
                        key={region.code}
                        className="geo-region-name"
                        x={x}
                        y={y}
                        textAnchor="middle"
                        pointerEvents="none"
                      >
                        {(!nearPin && mapRegions.length <= 26) ||
                        hovered === region.name
                          ? region.name
                          : ""}
                      </text>
                    );
                  })}
                </svg>
              )}
              <div className="geo-map-legend">
                <span>
                  <i />
                  고객이 있는 지역
                </span>
                <span>
                  {hovered ||
                    (current?.level === 3
                      ? "핀은 행정구역 대표 위치입니다"
                      : "숫자는 등록된 고객사 수입니다")}
                </span>
              </div>
            </div>
            <details className="geo-region-picker">
              <summary>
                <b>
                  {current?.level === 3
                    ? "선택한 지역"
                    : `${current?.level === 2 ? "읍·면·동" : current?.level === 1 ? "시·군·구" : "시·도"} 목록`}
                </b>
                <span>
                  {children.length
                    ? `${children.length}개 지역`
                    : "행정동 기준"}
                </span>
              </summary>
              <div>
                {(children.length ? children : current ? [current] : []).map(
                  (r) => (
                    <button
                      key={r.code}
                      onClick={() => navigate(r.code)}
                      className={countFor(r) ? "has-customers" : ""}
                    >
                      {r.name}
                      <span>{countFor(r) || "–"}</span>
                    </button>
                  ),
                )}
              </div>
            </details>
          </div>
          <aside className="geo-customer-panel">
            <div className="geo-panel-heading">
              <div>
                <h3>
                  {unmapped
                    ? "위치 미등록 고객"
                    : query.trim()
                      ? "검색된 고객"
                      : "이 지역의 고객"}{" "}
                  <span>{customers.length}</span>
                </h3>
                <p>
                  {unmapped
                    ? "명함 주소와 행정구역을 연결해주세요."
                    : query.trim()
                      ? "전국의 고객·주소 검색 결과"
                      : current?.fullName || "전국에 연결된 우리 팀의 고객"}
                </p>
              </div>
              {(current || unmapped) && (
                <button className="text-button" onClick={() => navigate("kr")}>
                  전체
                </button>
              )}
            </div>
            <div className="geo-customer-list">
              {customers.map(({ customer, region }) => (
                <button
                  className={`geo-customer ${selectedId === customer.id ? "selected" : ""}`}
                  key={customer.id}
                  onClick={() =>
                    focusCustomer(customer.id)
                  }
                >
                  <Company c={customer} />
                  <span className="geo-customer-location">
                    <MapPin size={13} />
                    {region?.fullName || "위치 연결 필요"}
                  </span>
                  <span className="geo-customer-meta">
                    <Badge>{customer.stage}</Badge>
                    <span>대화 {visibleRecords(s, customer.id).length}건</span>
                  </span>
                </button>
              ))}
              {!customers.length && (
                <Empty>
                  {query
                    ? "검색 조건에 맞는 고객이 없어요."
                    : unmapped
                      ? "모든 고객의 위치가 연결되어 있어요."
                      : "아직 이 지역에 등록된 고객이 없어요."}
                </Empty>
              )}
            </div>
          </aside>
        </div>
        <div className="geo-source">
          <span>
            경계 {index?.version || "2026-10-01"} · 행정동 기준 · 건물 위치가
            아닌 지역 단위 표시
          </span>
          <a
            href="https://github.com/vuski/admdongkor"
            target="_blank"
            rel="noreferrer"
          >
            SGIS 원자료 · vuski/admdongkor 가공 · CC BY 4.0
          </a>
        </div>
      </section>
      <div className="geo-network-panel" aria-label="선택한 고객의 관계" aria-live="polite">
        {selected ? <RelationshipGraph key={selected.customer.id} customer={selected.customer}
          onMap={selected.region ? () => focusCustomer(selected.customer.id) : undefined} /> :
          <section className="card unified-empty"><Network size={44} /><h2>{loading && !index ? "고객 관계를 불러오고 있어요" : "이 범위에 연결된 고객이 없어요"}</h2>
            <p>지역이나 검색어를 바꾸면 연결된 고객과 인물 관계를 함께 볼 수 있습니다.</p>
            <button className="btn" onClick={() => navigate("kr")}>전체 고객 보기</button>
            <button className="text-button" onClick={() => open("customer-add")}>새 고객 등록<Plus size={14} /></button>
          </section>}
      </div>
    </div>
  );
}
