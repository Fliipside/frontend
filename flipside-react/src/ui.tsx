import type { ReactNode, CSSProperties } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Check,
  AudioLines,
  Lock,
  Users,
  ArrowRight,
} from "lucide-react";
import { useStore } from "./store";
import {
  visibleRecords,
  visibleHistory,
  type RecordItem,
  type Customer,
} from "./model";
export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  return <span className={`avatar av-${index % 4}`}>{name.slice(0, 1)}</span>;
}
export function Company({ c }: { c: Customer }) {
  return (
    <span className="company">
      <span
        className={`company-logo logo-${c.id === "nova" ? 0 : c.id === "green" ? 1 : c.id === "bloom" ? 2 : 3}`}
      >
        {c.initial}
      </span>
      <span>
        <strong>{c.name}</strong>
        <small>
          {c.person} · {c.role}
        </small>
      </span>
    </span>
  );
}
export function Head({
  title,
  sub,
  children,
  eyebrow,
}: {
  title: string;
  sub: string;
  children?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="head-actions">{children}</div>
    </div>
  );
}
export function CardHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card-head">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </div>
  );
}
export function Orb({ small = false }: { small?: boolean }) {
  return (
    <div className={`orb-scene ${small ? "mini" : ""}`} aria-hidden="true">
      <div className="orb-shadow" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orb" />
      <div className="satellite satellite-a" />
      <div className="satellite satellite-b" />
      <div className="glass-tag tag-a">
        <Sparkles size={16} /> 관계를 기억해요
      </div>
      <div className="glass-tag tag-b">
        <Check size={14} /> 다음 기회 발견
      </div>
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Sparkles />
      <p>{children}</p>
    </div>
  );
}
export function Wave({ active = false }: { active?: boolean }) {
  return (
    <div className={`wave ${active ? "playing" : ""}`} aria-hidden="true">
      {Array.from({ length: 39 }, (_, i) => (
        <i
          key={i}
          style={{
            height: 9 + Math.abs(Math.sin(i * 2.3)) * 36,
            animationDelay: `${i * 0.03}s`,
          }}
        />
      ))}
    </div>
  );
}
export function ActionRow({
  r,
  full = false,
}: {
  r: RecordItem;
  full?: boolean;
}) {
  const { s, update, open, notify } = useStore();
  const c = s.customers.find((c) => c.id === r.customer)!;
  const done = s.done.includes(r.id),
    confirmed = s.confirmed.includes(r.id),
    late = r.dueDate < s.clock.slice(0, 10);
  return (
    <article className={`action-row ${done ? "completed" : ""}`}>
      <button
        className={`check-button ${done ? "checked" : ""}`}
        aria-label={`${r.fields.promise} ${done ? "완료 취소" : "완료"}`}
        aria-pressed={done}
        onClick={() => {
          update((s) => ({
            ...s,
            done: done ? s.done.filter((id) => id !== r.id) : [...s.done, r.id],
          }));
          notify(done ? "완료를 취소했어요." : "후속 행동을 완료했어요.");
        }}
      >
        {done && <Check size={13} />}
      </button>
      <div className="action-main">
        <div className="action-title">{r.fields.promise}</div>
        <div className="meta">
          <span
            className={`tiny-logo logo-${c.id === "nova" ? 0 : c.id === "green" ? 1 : 2}`}
          >
            {c.initial}
          </span>
          {c.name}
          <span>·</span>
          {r.client}
          {confirmed && <Badge tone="green">일정 확정</Badge>}
        </div>
        {full && (
          <>
            <blockquote>
              “{r.fields.promise} 부탁드립니다.”
              <small>
                {r.date} {r.kind} · 01:32
              </small>
            </blockquote>
            <p className="muted">
              {r.fields.signal}. {r.dueDate}에 후속 연락을 추천해요.
            </p>
            <div className="button-row">
              <button className="btn" onClick={() => open("evidence", r.id)}>
                <AudioLines size={15} />
                추천 근거
              </button>
              <button
                className="btn primary"
                disabled={confirmed}
                onClick={() => {
                  update((s) => ({
                    ...s,
                    confirmed: [...new Set([...s.confirmed, r.id])],
                  }));
                  notify("캘린더에 후속 행동이 추가되었어요.");
                }}
              >
                {confirmed ? "일정 확정됨" : "추천 일정 확정"}
                <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
      <button className="action-due" onClick={() => open("evidence", r.id)}>
        <Badge
          tone={
            done
              ? "gray"
              : late
                ? "red"
                : r.dueDate === s.clock.slice(0, 10)
                  ? "orange"
                  : "gray"
          }
        >
          {done
            ? "완료"
            : late
              ? "기한 지남"
              : r.dueDate === s.clock.slice(0, 10)
                ? "오늘"
                : r.dueDate.slice(5).replace("-", ".")}
        </Badge>
        {!full && <ChevronRight size={15} />}
      </button>
    </article>
  );
}
export function CustomerTable({ customers }: { customers: Customer[] }) {
  const { s, open } = useStore();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>고객사 / 담당자</th>
            <th>관계 단계</th>
            <th>관계 온도</th>
            <th>최근 대화</th>
            <th>다음 미팅</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const records = visibleRecords(s, c.id).toSorted((a, b) =>
              b.date.localeCompare(a.date),
            );
            return (
              <tr key={c.id}>
                <td>
                  <button
                    className="table-customer"
                    onClick={() => open("customer", c.id)}
                  >
                    <Company c={c} />
                  </button>
                </td>
                <td>
                  <Badge
                    tone={
                      c.stage === "협상 중"
                        ? "green"
                        : c.stage === "관계 형성"
                          ? "purple"
                          : "blue"
                    }
                  >
                    {c.stage}
                  </Badge>
                </td>
                <td>
                  <div className="temperature">
                    <span>
                      {Array.from({ length: 5 }, (_, i) => (
                        <i className={i < c.score ? "filled" : ""} key={i} />
                      ))}
                    </span>
                    <small>{c.score >= 4 ? "따뜻함" : "알아가는 중"}</small>
                  </div>
                </td>
                <td className="muted">
                  {records[0]?.date.slice(5).replace("-", ".") || "기록 없음"}
                </td>
                <td>
                  {s.meetings
                    .filter(
                      (m) =>
                        m.customer === c.id && m.date >= s.clock.slice(0, 10),
                    )
                    .toSorted((a, b) => a.date.localeCompare(b.date))[0]
                    ?.date.slice(5)
                    .replace("-", ".") || "미정"}
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`${c.name} 상세`}
                    onClick={() => open("customer", c.id)}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!customers.length && <Empty>검색 조건에 맞는 고객이 없어요.</Empty>}
    </div>
  );
}
export function Timeline({
  customer,
  limit,
}: {
  customer?: string;
  limit?: number;
}) {
  const { s, open } = useStore();
  const items = [
    ...visibleRecords(s, customer).map((r) => ({
      id: r.id,
      date: r.date,
      title: r.title,
      note: r.fields.promise,
      kind: r.kind,
      scope: r.scope,
    })),
    ...visibleHistory(s, customer).map((h) => ({
      id: h.id,
      date: h.date,
      title: `${s.customers.find((c) => c.id === h.customer)?.name} · ${h.outcome}`,
      note: `${h.amount.toLocaleString()}만 원 · ${h.note}`,
      kind: "거래",
      scope: h.scope,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="timeline">
      {items.slice(0, limit).map((e, i) => (
        <article key={e.id}>
          <span className={`timeline-point tp-${i % 3}`}>
            {e.kind === "통화" ? (
              <AudioLines size={14} />
            ) : e.kind === "거래" ? (
              <Check size={14} />
            ) : (
              <Users size={14} />
            )}
          </span>
          <div>
            <div className="timeline-meta">
              {e.date.slice(5).replace("-", ".")} · {e.kind}
              <span>
                {e.scope === "team" ? <Users size={12} /> : <Lock size={12} />}
              </span>
            </div>
            <button
              disabled={e.kind === "거래"}
              onClick={() => open("analysis", e.id)}
            >
              {e.title}
            </button>
            <p>{e.note}</p>
          </div>
        </article>
      ))}
      {!items.length && <Empty>공개된 관계 기록이 없어요.</Empty>}
    </div>
  );
}
export function MiniChart({
  values = [24, 40, 29, 52, 43, 70, 86],
  color = "#4A58F6",
}: {
  values?: number[];
  color?: string;
}) {
  return (
    <svg className="sparkline" viewBox="0 0 120 50" aria-hidden="true">
      <path
        d={`M${values.map((v, i) => `${i * 19},${48 - v * 0.45}`).join(" L")}`}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export const cssVar = (name: string, value: string): CSSProperties => ({
  [name]: value,
});
