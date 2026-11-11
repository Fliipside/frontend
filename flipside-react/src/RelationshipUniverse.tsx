import { useState, type CSSProperties } from "react";
import { ArrowUpRight, AudioLines, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { useStore } from "./store";
import { decisions, latest, visibleRecords, type Customer } from "./model";
import { Avatar, Badge, Company, Empty } from "./ui";
import { cardLocation } from "./geography";
import "./relationship-universe.css";

const stages = ["전체", "관계 형성", "제안 검토", "협상 중"];
// Inner rings hold customers closer to a deal.
const rings: Record<string, number> = { "협상 중": 0, "제안 검토": 1, "관계 형성": 2 };
const radius = [19, 31, 43];
// Relationship temperature from cool blue (new) to warm amber (close).
const warmth = (score: number) =>
  ["#4c7dff", "#4c7dff", "#62a8ff", "#a78bff", "#ff9b6a", "#ffc24b"][Math.max(0, Math.min(5, score))];
const short = (date: string) => date.slice(5).replace("-", ".");

export default function RelationshipUniverse({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { s } = useStore();
  const [stage, setStage] = useState("전체");
  const today = s.clock.slice(0, 10);
  const records = visibleRecords(s);
  const byRing: Customer[][] = [[], [], []];
  for (const c of s.customers) byRing[rings[c.stage] ?? 2].push(c);
  const placed = byRing.flatMap((list, ring) =>
    list.map((c, i) => {
      const a = (i / list.length) * Math.PI * 2 + ring * 1.1 - Math.PI / 2;
      return { c, x: 50 + radius[ring] * Math.cos(a), y: 50 + radius[ring] * Math.sin(a) };
    }),
  );
  const selected = s.customers.find((c) => c.id === selectedId) || s.customers[0];
  return (
    <div className="uv-layout">
      <section className="uv-space" aria-labelledby="uv-title">
        <div className="uv-head">
          <h2 id="uv-title">우리 팀과 고객의 거리</h2>
          <div className="uv-filter" role="group" aria-label="관계 단계">
            {stages.map((v) => (
              <button key={v} aria-pressed={stage === v} onClick={() => setStage(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="uv-sky">
          {radius.map((r, i) => (
            <span key={r} className="uv-ring" style={{ "--r": `${r * 2}%` } as CSSProperties}>
              <em>{["협상 중", "제안 검토", "관계 형성"][i]}</em>
            </span>
          ))}
          <div className="uv-orbit">
            <svg viewBox="0 0 100 100" className="uv-threads" aria-hidden="true">
              {placed.map(({ c, x, y }) => {
                const last = latest(s, c.id);
                const fresh = last && +new Date(today) - +new Date(last.date) <= 3 * 864e5;
                return (
                  <g key={c.id} className={stage === "전체" || c.stage === stage ? "" : "dim"}>
                    <line x1="50" y1="50" x2={x} y2={y} style={{ stroke: warmth(c.score) }} />
                    {fresh && (
                      <circle r="0.9" className="uv-signal" style={{ fill: warmth(c.score) }}>
                        <animateMotion dur="2.6s" repeatCount="indefinite" path={`M${x} ${y} L50 50`} />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
            {placed.map(({ c, x, y }) => {
              const pending = records.filter((r) => r.customer === c.id && !s.done.includes(r.id));
              const late = pending.some((r) => r.dueDate < today);
              const r = latest(s, c.id);
              return (
                <button
                  key={c.id}
                  className={`uv-node ${pending.length ? "pending" : ""} ${late ? "late" : ""} ${stage === "전체" || c.stage === stage ? "" : "dim"}`}
                  style={{ left: `${x}%`, top: `${y}%`, "--glow": warmth(c.score) } as CSSProperties}
                  aria-pressed={selected?.id === c.id}
                  aria-label={`${c.name} ${c.person}, ${c.stage}, 남은 약속 ${pending.length}건`}
                  onClick={() => onSelect(c.id)}
                >
                  <span className="uv-body">
                    <span className="uv-orb">{c.initial}</span>
                    <span className="uv-name">{c.name}</span>
                    <span className="uv-card" aria-hidden="true">
                      <b>
                        {c.person} {c.role}
                      </b>
                      <span>{c.stage}</span>
                      <i>{r ? r.fields.promise : "아직 대화가 없어요"}</i>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <span className="uv-core" aria-hidden="true">
            <img src="/brand/flipside-symbol.png" alt="" />
            우리 팀
          </span>
        </div>
        <p className="uv-key">
          <span>
            <i className="cold" />
            <i className="warm" />
            관계 온도
          </span>
          <span>
            <i className="pulse" />
            남은 약속
          </span>
          <span>
            <i className="signal" />
            최근 3일 대화
          </span>
          <span>안쪽 궤도일수록 계약에 가까워요</span>
        </p>
      </section>
      {selected && <CustomerPanel key={selected.id} c={selected} />}
    </div>
  );
}
function CustomerPanel({ c }: { c: Customer }) {
  const { s, open } = useStore();
  const r = latest(s, c.id);
  const records = visibleRecords(s, c.id);
  const pending = records
    .filter((x) => !s.done.includes(x.id))
    .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate));
  const next = pending[0];
  const meeting = s.meetings
    .filter((m) => m.customer === c.id && `${m.date}T${m.start}` >= s.clock)
    .toSorted((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
  const path = r
    ? [
        { key: "me", name: r.self, role: "영업 담당", note: "직접 대화" },
        { key: "staff", name: "정수현", role: "기술 검토", note: "연결 확인 필요" },
        { key: "client", name: r.client, role: c.role, note: "주요 접점" },
        { key: "decision", name: decisions[c.id] || c.person, role: "의사결정 관련", note: "권한 확인 필요" },
      ]
    : [];
  return (
    <aside className="card uv-panel" aria-live="polite">
      <div className="uv-panel-head">
        <Company c={c} />
        <Badge tone={c.stage === "협상 중" ? "green" : "blue"}>{c.stage}</Badge>
      </div>
      <p className="uv-facts">
        대화 {records.length}건 · 남은 약속 {pending.length}건 · 다음 미팅{" "}
        {meeting ? `${short(meeting.date)} ${meeting.start}` : "미정"}
      </p>
      {r ? (
        <>
          <h3 className="uv-label">이렇게 이어가요</h3>
          <ol className="uv-path">
            {path.map((p, i) => (
              <li key={p.key}>
                <button onClick={() => open("person", c.id, p.key)}>
                  <Avatar name={p.name} index={i} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {i < 2 ? "우리 팀" : c.name} · {p.role}
                    </small>
                  </span>
                  <em className={p.note.includes("확인") ? "check" : ""}>{p.note}</em>
                </button>
              </li>
            ))}
          </ol>
          {next && (
            <button className="uv-next" onClick={() => open("evidence", next.id)}>
              <span>
                <Sparkles size={14} />
                다음 행동 · {short(next.dueDate)}
              </span>
              <strong>{next.fields.promise}</strong>
              <ChevronRight size={16} />
            </button>
          )}
          <button className="uv-recent" onClick={() => open("analysis", r.id)}>
            <AudioLines size={15} />
            <span>
              {r.title}
              <small>
                {r.date} · {r.kind}
              </small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        </>
      ) : (
        <Empty>
          지금 보기에서 확인할 대화가 없어요.
          <button className="btn primary" onClick={() => open("record")}>
            새 대화 기록
          </button>
        </Empty>
      )}
      <button className="uv-address" onClick={() => open("customer", c.id, "address")}>
        <MapPin size={14} />
        {cardLocation(c)?.address || "명함 사진 올리기"}
      </button>
      <div className="uv-actions">
        <button className="btn" disabled={!r} onClick={() => open("intro", c.id)}>
          사내 소개 경로
        </button>
        <button className="btn primary" onClick={() => open("customer", c.id)}>
          관계 기억 열기
        </button>
      </div>
    </aside>
  );
}
