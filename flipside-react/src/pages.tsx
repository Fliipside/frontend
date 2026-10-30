import { useState } from "react";
import {
  Plus,
  Upload,
  Search,
  LayoutGrid,
  List,
  ArrowUpRight,
  ArrowRight,
  Mic,
  Phone,
  AudioLines,
  Users,
  Lock,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ShieldCheck,
  Network,
  Download,
  Clock,
  RotateCcw,
  MapPin,
} from "lucide-react";
import { useStore } from "./store";
import RelationshipMap from "./RelationshipMap";

import {
  visibleRecords,
  visibleHistory,
  latest,
  dateKey,
  collectCalls,
} from "./model";
import {
  Head,
  CardHead,
  Badge,
  Company,
  Avatar,
  CustomerTable,
  Empty,
  ActionRow,
  Orb,
  Wave,
} from "./ui";
export function CustomersPage() {
  const { s, open } = useStore();
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("전체"),
    [view, setView] = useState("list");
  const list = s.customers.filter(
    (c) =>
      (filter === "전체" || c.stage === filter) &&
      `${c.name} ${c.person}`.includes(q),
  );
  return (
    <>
      <Head
        eyebrow="RELATIONSHIP MEMORY"
        title="고객 & 관계 기억"
        sub="대화가 쌓일수록, 고객을 더 깊이 이해하게 됩니다."
      >
        <button className="btn" onClick={() => open("import")}>
          <Upload size={16} />
          기존 고객 가져오기
        </button>
        <button className="btn primary" onClick={() => open("customer-add")}>
          <Plus size={16} />
          고객 등록
        </button>
      </Head>
      <div className="customer-stats">
        {["전체", "관계 형성", "제안 검토", "협상 중"].map((stage, i) => (
          <button
            className={`card customer-stat ${filter === stage ? "selected" : ""}`}
            onClick={() => setFilter(stage)}
            key={stage}
          >
            <span
              className={`metric-icon ${["blue", "purple", "orange", "green"][i]}`}
            >
              <Users size={19} />
            </span>
            <strong>
              {stage === "전체"
                ? s.customers.length
                : s.customers.filter((c) => c.stage === stage).length}
              <small>곳</small>
            </strong>
            <span>{stage === "전체" ? "전체 고객" : stage}</span>
            <ArrowUpRight size={17} />
          </button>
        ))}
      </div>
      <section className="card">
        <div className="list-toolbar">
          <div className="tabs">
            {["전체", "관계 형성", "제안 검토", "협상 중"].map((v) => (
              <button
                key={v}
                className={filter === v ? "active" : ""}
                onClick={() => setFilter(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="button-row">
            <label className="input-search">
              <Search size={16} />
              <input
                placeholder="고객사 또는 담당자 검색"
                aria-label="고객 검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <div className="view-toggle">
              <button
                className={view === "list" ? "active" : ""}
                aria-label="목록 보기"
                onClick={() => setView("list")}
              >
                <List size={17} />
              </button>
              <button
                className={view === "grid" ? "active" : ""}
                aria-label="카드 보기"
                onClick={() => setView("grid")}
              >
                <LayoutGrid size={17} />
              </button>
            </div>
          </div>
        </div>
        {view === "list" ? (
          <CustomerTable customers={list} />
        ) : (
          <div className="company-grid">
            {list.map((c) => (
              <button
                className="company-card"
                key={c.id}
                onClick={() => open("customer", c.id)}
              >
                <Company c={c} />
                <div className="company-card-data">
                  <span>
                    업종<b>{c.industry}</b>
                  </span>
                  <span>
                    관계 단계
                    <Badge tone={c.stage === "협상 중" ? "green" : "blue"}>
                      {c.stage}
                    </Badge>
                  </span>
                  <span>
                    대화 기록<b>{visibleRecords(s, c.id).length}건</b>
                  </span>
                  <span>
                    다음 약속<b>{latest(s, c.id)?.dueDate || "미정"}</b>
                  </span>
                </div>
                <span className="company-card-link">
                  관계 기억 열기
                  <ArrowUpRight size={15} />
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="table-footer">
          총 {list.length}개의 고객<span>가상 데이터 · 이 브라우저에 저장</span>
        </div>
      </section>
    </>
  );
}
export function RecordsPage() {
  const { s, open, update } = useStore();
  const [filter, setFilter] = useState("전체"),
    [q, setQ] = useState("");
  const records = visibleRecords(s).filter(
    (r) => (filter === "전체" || r.kind === filter) && r.title.includes(q),
  );
  return (
    <>
      <Head
        eyebrow="CONVERSATIONS THAT MATTER"
        title="대화 기록"
        sub="흩어진 대화를 모아, 관계의 맥락으로 정리하세요."
      >
        <button className="btn" onClick={() => open("upload")}>
          <Upload size={16} />
          통화 녹음 가져오기
        </button>
        <button className="btn primary" onClick={() => open("record")}>
          <Plus size={16} />새 대화 기록
        </button>
      </Head>
      <section className="record-banner">
        <div className="record-banner-icon">
          <AudioLines size={34} />
        </div>
        <div>
          <Badge>RELATIONSHIP MEMORY</Badge>
          <h2>한 번의 대화, 여섯 가지 관계의 단서.</h2>
          <p>요구사항부터 약속까지, AI가 정리한 대화의 핵심을 확인하세요.</p>
        </div>
        <div className="pipeline-mini">
          <span>음성 전사</span>
          <ArrowRight />
          <span>화자 분리</span>
          <ArrowRight />
          <span>핵심 추출</span>
        </div>
      </section>
      <div className="list-toolbar standalone">
        <div className="tabs">
          {["전체", "미팅", "통화"].map((v) => (
            <button
              className={filter === v ? "active" : ""}
              key={v}
              onClick={() => setFilter(v)}
            >
              {v === "전체" ? "전체 대화" : v}
            </button>
          ))}
        </div>
        <label className="input-search">
          <Search size={16} />
          <input
            aria-label="대화 검색"
            placeholder="대화 제목 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>
      <div className="record-grid">
        {records.map((r, i) => (
          <article className="card record-card" key={r.id}>
            <div className="record-card-top">
              <span
                className={`record-icon ${r.kind === "통화" ? "green" : ""}`}
              >
                {r.kind === "미팅" ? <Mic size={22} /> : <Phone size={22} />}
              </span>
              <Badge tone="green">
                <Check size={11} />
                분석 완료
              </Badge>
            </div>
            <button
              className="record-title"
              onClick={() => open("analysis", r.id)}
            >
              {r.title}
            </button>
            <p className="muted">
              {r.date.replaceAll("-", ". ")} · {r.duration}
            </p>
            <Wave />
            <div className="record-tags">
              <Badge>{r.kind}</Badge>
              <Badge tone="purple">핵심 정보 6개</Badge>
            </div>
            <div className="record-excerpt">{r.fields.promise}</div>
            <div className="record-card-bottom">
              <button
                className="text-button"
                disabled={s.viewer === "team"}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    records: s.records.map((x) =>
                      x.id === r.id
                        ? {
                            ...x,
                            scope: x.scope === "team" ? "private" : "team",
                          }
                        : x,
                    ),
                  }))
                }
              >
                {r.scope === "team" ? <Users size={13} /> : <Lock size={13} />}{" "}
                {r.scope === "team" ? "팀 공유" : "나만 보기"}
              </button>
              <button
                className="text-button blue-text"
                onClick={() => open("analysis", r.id)}
              >
                분석 보기
                <ArrowUpRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!records.length && (
        <Empty>아직 대화가 없어요. 새로운 대화를 기록해보세요.</Empty>
      )}
    </>
  );
}
export function ActionsPage() {
  const { s } = useStore();
  const [tab, setTab] = useState("전체");
  const records = visibleRecords(s);
  const list = records.filter(
    (r) =>
      tab === "전체" ||
      (tab === "완료"
        ? s.done.includes(r.id)
        : tab === "일정 확정"
          ? s.confirmed.includes(r.id)
          : !s.done.includes(r.id)),
  );
  return (
    <>
      <Head
        eyebrow="MAKE THE NEXT MOVE"
        title="다음 행동"
        sub="고객과 나눈 약속, 가장 좋은 순간에 이어가세요."
      />
      <div className="action-hero">
        <div>
          <span className="eyebrow">AI NEXT ACTION</span>
          <h2>
            지금 이어가면 좋은 관계가
            <br />
            <b>{records.filter((r) => !s.done.includes(r.id)).length}건</b>{" "}
            있어요.
          </h2>
          <p>추천 이유와 대화의 근거를 확인하고, 다음 일정을 확정하세요.</p>
        </div>
        <Orb small />
      </div>
      <div className="tabs page-tabs">
        {["전체", "해야 할 일", "일정 확정", "완료"].map((v) => (
          <button
            className={tab === v ? "active" : ""}
            key={v}
            onClick={() => setTab(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="action-list">
        {list.map((r) => (
          <section className="card full-action" key={r.id}>
            <ActionRow r={r} full />
          </section>
        ))}
      </div>
      {!list.length && <Empty>해당하는 후속 행동이 없어요.</Empty>}
    </>
  );
}
export function NetworkPage() {
  const { s, open } = useStore();
  const [id, setId] = useState(s.customers[0]?.id || "");
  return (
    <>
      <Head
        eyebrow="RELATIONSHIP EXPLORER"
        title="관계도"
        sub="지역에서 고객을 찾고, 사람과 대화의 연결을 한눈에 살펴보세요."
      >
        <button className="btn" disabled={!id || !latest(s, id)} onClick={() => open("intro", id)}>
          <Network size={16} />사내 소개 경로 탐색
        </button>
        <button className="btn primary" onClick={() => open("customer-add")}>
          <Plus size={16} />고객 등록
        </button>
      </Head>
      <RelationshipMap selectedId={id} onSelect={setId} />
    </>
  );
}
export function ClockPanel() {
  const { s, update, notify } = useStore();
  return (
    <div className="clock-panel">
      <span>
        <Clock size={15} />
        <b>시연 시간</b>
        {s.clock.replace("T", " · ")}
      </span>
      <div>
        <button
          onClick={() => {
            const m = s.meetings
              .toSorted((a, b) =>
                (a.date + a.start).localeCompare(b.date + b.start),
              )
              .find((m) => `${m.date}T${m.start}` >= s.clock);
            if (!m) {
              notify("다가오는 미팅을 먼저 등록해주세요.");
              return;
            }
            const d = new Date(`${m.date}T${m.start}`);
            d.setMinutes(d.getMinutes() - 30);
            update((s) => ({
              ...s,
              clock: `${dateKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
            }));
            notify("미팅 30분 전 · 브리핑 준비 알림이 생성되었어요.");
          }}
        >
          미팅 30분 전 시연
        </button>
        <button
          onClick={() => {
            const d = new Date(s.clock);
            d.setDate(d.getDate() + 1);
            update((s) => ({ ...s, clock: `${dateKey(d)}T13:00` }));
          }}
        >
          하루 뒤로
        </button>
        <button
          aria-label="시간 초기화"
          onClick={() =>
            update((s) => ({ ...s, clock: "2026-10-21T13:00", briefings: [] }))
          }
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}
export function CalendarPage() {
  const { s, open } = useStore();
  const [month, setMonth] = useState(
      () => new Date(s.clock.slice(0, 7) + "-01T12:00"),
    ),
    [selected, setSelected] = useState(s.clock.slice(0, 10));
  const events = [
    ...s.meetings.map((m) => ({ ...m, kind: "미팅" })),
    ...visibleRecords(s)
      .filter((r) => s.confirmed.includes(r.id))
      .map((r) => ({
        id: r.id,
        customer: r.customer,
        date: r.dueDate,
        title: r.fields.promise,
        start: "",
        end: "",
        place: "확정된 후속 행동",
        kind: "후속 행동",
      })),
  ];
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dayEvents = events.filter((m) => m.date === selected);
  const move = (n: number) => {
    const d = new Date(month.getFullYear(), month.getMonth() + n, 1, 12);
    setMonth(d);
    setSelected(dateKey(d));
  };
  return (
    <>
      <Head
        eyebrow="MAKE TIME FOR RELATIONSHIPS"
        title="캘린더"
        sub="미팅 일정부터 후속 약속까지, 관계를 이어갈 시간을 한눈에."
      >
        <button
          className="btn primary"
          onClick={() => open("meeting", selected)}
        >
          <Plus size={16} />
          미팅 등록
        </button>
      </Head>
      <ClockPanel />
      <div className="calendar-layout">
        <section className="card calendar-panel">
          <CardHead
            title={`${month.getFullYear()}년 ${month.getMonth() + 1}월`}
          >
            <div className="button-row">
              <button
                className="btn small"
                onClick={() => {
                  setSelected(s.clock.slice(0, 10));
                  setMonth(new Date(s.clock.slice(0, 7) + "-01T12:00"));
                }}
              >
                오늘
              </button>
              <button
                className="icon-button"
                aria-label="이전 달"
                onClick={() => move(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="다음 달"
                onClick={() => move(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </CardHead>
          <div className="weekdays">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: month.getDay() }, (_, i) => (
              <div className="blank-day" key={"empty" + i} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = dateKey(
                new Date(month.getFullYear(), month.getMonth(), i + 1, 12),
              );
              const entries = events.filter((e) => e.date === date);
              return (
                <button
                  className={`calendar-day ${selected === date ? "selected" : ""} ${date === s.clock.slice(0, 10) ? "today" : ""}`}
                  key={date}
                  aria-label={`${date} 일정 ${entries.length}건`}
                  aria-pressed={selected === date}
                  onClick={() => setSelected(date)}
                >
                  <span>{i + 1}</span>
                  {entries.slice(0, 2).map((e) => (
                    <span
                      className={`event-chip ${e.kind === "후속 행동" ? "followup" : ""}`}
                      key={e.id}
                    >
                      <small>{e.start || "후속 약속"}</small>
                      {s.customers.find((c) => c.id === e.customer)?.name}
                    </span>
                  ))}
                  {entries.length > 2 && <small>+{entries.length - 2}개</small>}
                </button>
              );
            })}
          </div>
          <div className="calendar-key">
            <span>
              <i />
              고객 미팅
            </span>
            <span>
              <i />
              확정한 후속 행동
            </span>
          </div>
        </section>
        <aside className="agenda">
          <section className="card">
            <CardHead
              title={`${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8))}일의 일정`}
              sub={`${dayEvents.length}개의 약속이 기다리고 있어요.`}
            />
            {dayEvents.map((e) => (
              <article className="agenda-item" key={e.id}>
                <div>
                  <Badge tone={e.kind === "미팅" ? "blue" : "purple"}>
                    {e.kind}
                  </Badge>
                  <span>{e.start || "오늘 중"}</span>
                </div>
                <h3>{e.title}</h3>
                <p>
                  {s.customers.find((c) => c.id === e.customer)?.person} ·{" "}
                  {e.place}
                </p>
                <button
                  className="text-button blue-text"
                  onClick={() =>
                    open(
                      e.kind === "미팅" ? "meeting-detail" : "evidence",
                      e.id,
                    )
                  }
                >
                  {e.kind === "미팅" ? "일정 상세" : "추천 근거 확인"}
                  <ArrowRight size={14} />
                </button>
                {e.kind === "미팅" && (
                  <button
                    className="btn small"
                    onClick={() => open("briefing", e.customer)}
                  >
                    <Sparkles size={13} />
                    미팅 브리핑
                  </button>
                )}
              </article>
            ))}
            {!dayEvents.length && <Empty>등록된 일정이 없어요.</Empty>}
            <button
              className="agenda-add"
              onClick={() => open("meeting", selected)}
            >
              <Plus size={15} />이 날짜에 미팅 등록
            </button>
          </section>
          <section className="prep-card">
            <Sparkles size={28} />
            <span className="eyebrow">MEETING PREP</span>
            <h2>
              좋은 대화는
              <br />
              준비에서부터.
            </h2>
            <p>
              지난 대화와 아직 남은 약속,
              <br />한 장의 브리핑으로 확인하세요.
            </p>
            <div>
              <Check size={15} />
              지난 대화의 핵심
            </div>
            <div>
              <Check size={15} />
              아직 남아 있는 약속
            </div>
            <button
              onClick={() =>
                open("briefing", dayEvents[0]?.customer || s.customers[0].id)
              }
            >
              미팅 브리핑 열기
              <ArrowUpRight size={16} />
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      className={`switch ${checked ? "on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span />
    </button>
  );
}
export function SettingsPage() {
  const { s, update, open, notify } = useStore();
  return (
    <>
      <Head
        eyebrow="YOUR DATA, YOUR CHOICE"
        title="설정 및 공유 관리"
        sub="무엇을 수집하고, 어디까지 공유할지 직접 선택하세요."
      />
      <div className="settings-layout">
        <section className="card settings-card">
          <CardHead title="수집과 공유" sub="나와 우리 팀의 기록 관리" />
          <div className="setting-row">
            <div>
              <h3>보기 권한 시연</h3>
              <p>
                {s.viewer === "me"
                  ? "내 기록 전체를 보고 있어요."
                  : "팀에 공유된 기록만 보고 있어요."}
              </p>
            </div>
            <button
              className="btn small"
              onClick={() =>
                update((s) => ({
                  ...s,
                  viewer: s.viewer === "me" ? "team" : "me",
                }))
              }
            >
              {s.viewer === "me" ? "팀원 보기로 전환" : "내 보기로 전환"}
            </button>
          </div>
          <div className="setting-row">
            <div>
              <h3>새 기록의 기본 공유 범위</h3>
              <p>{s.team ? "팀 공유" : "나만 보기"}</p>
            </div>
            <Toggle
              label="새 기록 팀 공유"
              checked={s.team}
              onChange={() => update((s) => ({ ...s, team: !s.team }))}
            />
          </div>
          <div className="setting-row">
            <div>
              <h3>지정 연락처의 통화 가져오기</h3>
              <p>선택한 {s.contacts.length}명만 수집 시연에 포함돼요.</p>
            </div>
            <Toggle
              label="지정 연락처 통화 수집"
              checked={s.auto}
              onChange={() => update((s) => ({ ...s, auto: !s.auto }))}
            />
          </div>
          <div className="contact-select">
            {s.customers.map((c, i) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={s.contacts.includes(c.id)}
                  onChange={(e) =>
                    update((s) => ({
                      ...s,
                      contacts: e.target.checked
                        ? [...s.contacts, c.id]
                        : s.contacts.filter((id) => id !== c.id),
                    }))
                  }
                />
                <Avatar name={c.person} index={i} />
                <span>
                  <b>{c.person}</b>
                  <small>{c.name}</small>
                </span>
              </label>
            ))}
          </div>
          <button
            className="btn collect-button"
            onClick={() => {
              if (s.viewer === "team") {
                notify("내 보기로 전환한 후 통화를 수집해주세요.");
                return;
              }
              if (!s.auto) {
                notify("지정 연락처 통화 가져오기를 먼저 켜주세요.");
                return;
              }
              const next = collectCalls(s);
              update(() => next);
              notify(
                `${next.records.length - s.records.length}건 수집 · 미선택 연락처 제외 · 중복 방지`,
              );
            }}
          >
            <Phone size={15} />
            수신 통화 수집 시연
          </button>
          <div className="setting-row">
            <div>
              <h3>내 목소리 프로필</h3>
              <p>본인 목소리로 화자 구분을 시연해요.</p>
            </div>
            <button className="btn small" onClick={() => open("voice")}>
              {s.voice ? "등록됨 · 다시 보기" : "샘플 등록"}
            </button>
          </div>
          <div className="info-note">
            <ShieldCheck size={18} />
            기기 통화와 실제 팀 계정에 연결되지 않는 로컬 데모입니다.
          </div>
        </section>
        <section className="card settings-card">
          <CardHead
            title="기록별 공유 범위"
            sub="공유 설정은 검색, 관계 기억, 추천에도 적용돼요."
          />
          {visibleRecords(s).map((r) => (
            <div className="setting-row" key={r.id}>
              <div>
                <h3>{r.title}</h3>
                <p>{r.date}</p>
              </div>
              <button
                className="btn small"
                disabled={s.viewer === "team"}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    records: s.records.map((x) =>
                      x.id === r.id
                        ? {
                            ...x,
                            scope: x.scope === "team" ? "private" : "team",
                          }
                        : x,
                    ),
                  }))
                }
              >
                {r.scope === "team" ? <Users size={13} /> : <Lock size={13} />}{" "}
                {r.scope === "team" ? "팀 공유" : "나만 보기"}
              </button>
            </div>
          ))}
          <h3 className="settings-subtitle">거래 이력 공유 범위</h3>
          {visibleHistory(s).map((h) => (
            <div className="setting-row" key={h.id}>
              <div>
                <h3>
                  {s.customers.find((c) => c.id === h.customer)?.name} ·{" "}
                  {h.outcome}
                </h3>
                <p>{h.note}</p>
              </div>
              <button
                className="btn small"
                disabled={s.viewer === "team"}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    history: s.history.map((x) =>
                      x.id === h.id
                        ? {
                            ...x,
                            scope: x.scope === "team" ? "private" : "team",
                          }
                        : x,
                    ),
                  }))
                }
              >
                {h.scope === "team" ? "팀 공유" : "나만 보기"}
              </button>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
