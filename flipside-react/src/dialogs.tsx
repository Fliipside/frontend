import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  X,
  Search,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Check,
  Mic,
  Upload,
  Users,
  Lock,
  FileText,
  Download,
  CalendarDays,
  Network,
  Play,
  Square,
  ShieldCheck,
  AudioLines,
} from "lucide-react";
import { useStore } from "./store";
import {
  answer,
  visibleRecords,
  visibleHistory,
  latest,
  labels,
  transcript,
  newRecord,
  uid,
  validateMeeting,
  importCustomers,
  importSamples,
  decisions,
  type RecordItem,
  type Scope,
  type Meeting,
  type Fields,
} from "./model";
import { Badge, Company, Timeline, Empty, Wave, Avatar } from "./ui";
import { ClockPanel } from "./pages";
import CustomerAddress from "./CustomerAddress";
const titles: Record<string, string> = {
  customer: "고객 관계 기억",
  "customer-add": "새 고객 등록",
  record: "새 대화 기록",
  upload: "통화 녹음 가져오기",
  analysis: "대화 분석 결과",
  briefing: "AI 미팅 브리핑",
  evidence: "추천에는 이유가 있어요",
  search: "고객과 대화 검색",
  meeting: "새 미팅 등록",
  "meeting-detail": "캘린더 일정",
  import: "기존 고객과 거래 이력 가져오기",
  history: "수주·실패 이력 추가",
  notifications: "놓치지 않아야 할 순간",
  voice: "내 목소리 프로필",
  intro: "사내 소개 경로",
  person: "관계 연결 상세",
  profile: "내 프로필",
  help: "Flipside 사용 가이드",
  handover: "AI 인수인계 요약",
};
export default function Dialogs() {
  const { modal, close } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, [!!modal]);
  if (!modal) return null;
  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${modal.type}`}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      aria-labelledby="dialog-title"
    >
      <header className="dialog-header">
        <div>
          <span className="soft-icon">
            <Sparkles size={17} />
          </span>
          <h2 id="dialog-title">{titles[modal.type] || "Flipside"}</h2>
        </div>
        <button className="icon-button" onClick={close} aria-label="닫기">
          <X size={20} />
        </button>
      </header>
      <div className="dialog-body" key={`${modal.type}-${modal.id || ""}`}>
        <Content />
      </div>
    </dialog>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function CustomerSelect({
  name = "customer",
  value,
  onChange,
}: {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const { s } = useStore();
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {s.customers.map((c) => (
        <option value={c.id} key={c.id}>
          {c.name} · {c.person}
        </option>
      ))}
    </select>
  );
}
function ScopeSelect({
  value,
  onChange,
}: {
  value?: Scope;
  onChange?: (value: Scope) => void;
}) {
  return (
    <select
      name="scope"
      value={value}
      onChange={(e) => onChange?.(e.target.value as Scope)}
    >
      <option value="private">나만 보기</option>
      <option value="team">팀 공유</option>
    </select>
  );
}
function Content() {
  const { s, modal, open, close, update, notify } = useStore();
  const id = modal?.id;
  switch (modal?.type) {
    case "customer":
      return <CustomerDetail id={id!} />;
    case "analysis":
      return <Analysis id={id!} />;
    case "record":
      return <RecordForm />;
    case "upload":
      return <UploadForm />;
    case "search":
      return <SearchPanel />;
    case "meeting":
      return <MeetingForm />;
    case "customer-add":
      return <AddCustomer />;
    case "import":
      return <ImportPanel />;
    case "history":
      return <HistoryForm id={id!} />;
    case "briefing":
    case "handover":
      return <Briefing id={id!} handover={modal.type === "handover"} />;
    case "evidence": {
      const r = visibleRecords(s).find((r) => r.id === id);
      if (!r) return <Empty>확인할 수 있는 기록이 없어요.</Empty>;
      return (
        <>
          <Badge>AI NEXT ACTION</Badge>
          <h3 className="dialog-subtitle">{r.fields.promise}</h3>
          <div className="transcript-row">
            <span>
              {r.client} · {r.date} · 01:32
            </span>
            <p>“{transcript(r)[3].text}”</p>
          </div>
          <div className="info-note">
            <Sparkles size={18} />
            <div>
              {r.fields.signal}. {r.dueDate}에 후속 연락을 추천해요.
            </div>
          </div>
          <div className="dialog-footer">
            <button className="btn" onClick={() => open("analysis", id)}>
              원문 대화 확인
            </button>
            <button
              className="btn primary"
              disabled={s.confirmed.includes(r.id)}
              onClick={() => {
                update((s) => ({
                  ...s,
                  confirmed: [...new Set([...s.confirmed, r.id])],
                }));
                notify("추천 일정이 캘린더에 추가되었어요.");
              }}
            >
              {s.confirmed.includes(r.id) ? "일정 확정됨" : "추천 일정 확정"}
              <Check size={15} />
            </button>
          </div>
        </>
      );
    }
    case "meeting-detail": {
      const m = s.meetings.find((m) => m.id === id);
      if (!m) return <Empty>일정을 찾을 수 없어요.</Empty>;
      const c = s.customers.find((c) => c.id === m.customer)!;
      return (
        <>
          <div className="meeting-detail-date">
            <CalendarDays size={25} />
            <div>
              <h3>{m.title}</h3>
              <p>
                {m.date} · {m.start} — {m.end}
              </p>
            </div>
          </div>
          <div className="brief-block">
            <h3>참석 고객</h3>
            <Company c={c} />
          </div>
          <div className="brief-block">
            <h3>미팅 장소</h3>
            <p>{m.place}</p>
          </div>
          <div className="dialog-footer">
            <button
              className="btn primary"
              onClick={() => open("briefing", m.customer)}
            >
              <Sparkles size={16} />
              미팅 브리핑 열기
            </button>
          </div>
        </>
      );
    }
    case "notifications":
      return (
        <>
          <ClockPanel />
          {s.briefings
            .map((id) => s.meetings.find((m) => m.id === id))
            .filter((m) => !!m)
            .map((m) => (
              <button
                className="search-result"
                key={m.id}
                onClick={() => open("briefing", m.customer)}
              >
                <span className="soft-icon">
                  <Sparkles size={20} />
                </span>
                <span>
                  <strong>브리핑 자동 준비 · {m.title}</strong>
                  <small>
                    {m.date} {m.start} · 미팅 30분 전 알림
                  </small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          {visibleRecords(s)
            .filter((r) => !s.done.includes(r.id))
            .map((r) => (
              <button
                className="search-result"
                key={r.id}
                onClick={() => open("evidence", r.id)}
              >
                <span className="soft-icon">
                  <CalendarDays size={20} />
                </span>
                <span>
                  <strong>{r.fields.promise}</strong>
                  <small>
                    {r.dueDate} ·{" "}
                    {r.dueDate < s.clock.slice(0, 10)
                      ? "기한이 지난 후속 연락"
                      : "고객과의 약속"}
                  </small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
        </>
      );
    case "voice":
      return (
        <>
          <p className="dialog-description">
            내 목소리 프로필로 대화 속 화자를 구분해요.
            <br />이 데모에서는 실제 녹음 대신 샘플 프로필을 사용합니다.
          </p>
          <div className="voice-visual">
            <span className="mic-object">
              <Mic size={36} />
            </span>
            <Wave />
          </div>
          <div className="info-note">
            샘플 화자: 이지원 · 한국어 · {s.voice ? "등록 완료" : "미등록"}
          </div>
          <div className="dialog-footer">
            <button
              className="btn primary"
              onClick={() => {
                update((s) => ({ ...s, voice: true }));
                notify("샘플 음성 프로필을 등록했어요.");
                close();
              }}
            >
              <Check size={16} />
              샘플 프로필 등록
            </button>
          </div>
        </>
      );
    case "intro":
    case "person": {
      const r = latest(s, id!);
      if (!r) return <Empty>현재 보기에서 확인할 접점이 없어요.</Empty>;
      const decision = decisions[id!] || r.client;
      return (
        <>
          <p className="dialog-description">
            {s.customers.find((c) => c.id === id)?.name} · 대화에서 확인한 관계
          </p>
          {modal.type === "intro" ? (
            <>
              <div className="intro-path">
                {[r.self, "정수현", r.client, decision].map((n, i) => (
                  <div key={n}>
                    <Avatar name={n} index={i} />
                    <b>{n}</b>
                    <small>
                      {
                        [
                          "영업 담당",
                          "기술 검토",
                          "고객 접점",
                          "의사결정 관련",
                        ][i]
                      }
                    </small>
                    {i < 3 && <ArrowRight size={16} />}
                  </div>
                ))}
              </div>
              <div className="info-note">
                정수현 님에게 기술 검토 맥락을 확인하고, {r.client} 님을 통해{" "}
                {decision} 님과의 미팅을 요청해보세요. 실제 소개 가능 여부와
                최종 권한은 확인이 필요해요.
              </div>
            </>
          ) : (
            <div className="brief-block">
              <h3>
                {
                  { me: r.self, staff: "정수현", client: r.client, decision }[
                    modal.tab || "me"
                  ]
                }
              </h3>
              <p>
                {modal.tab === "decision"
                  ? r.fields.decision
                  : modal.tab === "staff"
                    ? "기술 검토 협업 담당자로 대화에 언급되었어요."
                    : `${visibleRecords(s, id).length}건의 대화 접점 · 최근 ${r.date}`}
              </p>
            </div>
          )}
          <p className="muted">근거: {r.title} · 02:10</p>
          <div className="dialog-footer">
            <button
              className="btn primary"
              onClick={() => open("analysis", r.id)}
            >
              근거 대화 확인
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      );
    }
    case "profile":
      return (
        <>
          <div className="user-profile">
            <Avatar name="이지원" />
            <h3>이지원 매니저</h3>
            <p>Flipside · 영업팀</p>
          </div>
          <div className="brief-block">
            <h3>함께 기억하는 고객 관계</h3>
            <p>
              고객 {s.customers.length}곳 · 대화 {visibleRecords(s).length}건 ·
              관계 기억 {visibleRecords(s).length * 6}개
            </p>
          </div>
          <div className="info-note">
            <ShieldCheck size={18} />
            예시 데이터로 구성된 데모입니다. 실제 계정 및 외부 시스템과 연결되어
            있지 않습니다.
          </div>
        </>
      );
    case "help":
      return (
        <div className="help-list">
          {[
            [
              "01",
              "대화를 기록하세요",
              "미팅 녹음과 통화 가져오기로 샘플 대화를 생성하고, 화자와 6가지 핵심 정보를 확인하세요.",
            ],
            [
              "02",
              "관계를 기억하세요",
              "고객 상세에서 관계 기억, 타임라인, 거래 이력을 확인하고 AI에게 질문하세요.",
            ],
            [
              "03",
              "다음 행동으로 연결하세요",
              "추천 근거를 확인하고 일정을 확정하면 캘린더에서 후속 약속을 볼 수 있어요.",
            ],
            [
              "04",
              "우리 팀과 공유하세요",
              "설정에서 기록별 공유 범위를 바꾸고 팀원 보기로 확인하세요.",
            ],
          ].map(([n, title, desc]) => (
            <div className="brief-block" key={n}>
              <span className="eyebrow">STEP {n}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
          <div className="info-note">
            단축키 Ctrl / ⌘ + K: 통합 검색 · Esc: 상세 닫기
            <br />
            음성 인식·AI·파일 분석·계정 권한은 샘플 시연입니다. 변경은 현재
            브라우저에 저장됩니다.
          </div>
        </div>
      );
    default:
      return null;
  }
}
function CustomerDetail({ id }: { id: string }) {
  const { s, modal, open } = useStore();
  const [tab, setTab] = useState(modal?.tab || "memory"),
    [q, setQ] = useState(""),
    [response, setResponse] = useState("");
  const c = s.customers.find((c) => c.id === id)!;
  const r = latest(s, id);
  return (
    <>
      <div className="customer-detail-head">
        <Company c={c} />
        <Badge tone={c.stage === "협상 중" ? "green" : "blue"}>{c.stage}</Badge>
      </div>
      <div className="detail-tabs">
        {[
          ["memory", "관계 기억"],
          ["timeline", "관계 타임라인"],
          ["history", "수주·실패 이력"],
          ["address", "명함 주소"],
        ].map(([key, label]) => (
          <button
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "memory" ? (
        r ? (
          <>
            <p className="muted">
              대화 {visibleRecords(s, id).length}건 누적 · 최신 근거 {r.date}
            </p>
            <div className="memory-grid">
              {Object.entries(labels).map(([key, label]) => (
                <div className="memory-block" key={key}>
                  <span>{label}</span>
                  <p>{r.fields[key as keyof Fields]}</p>
                </div>
              ))}
            </div>
            <button
              className="text-button blue-text"
              onClick={() => open("analysis", r.id)}
            >
              최신 대화와 추출 근거 확인
              <ArrowUpRight size={15} />
            </button>
          </>
        ) : (
          <Empty>현재 보기에서 확인할 대화가 없어요.</Empty>
        )
      ) : tab === "timeline" ? (
        <Timeline customer={id} />
      ) : tab === "address" ? (
        <CustomerAddress key={id} customer={c} />
      ) : (
        <>
          <HistoryList id={id} />
          {s.viewer === "me" && (
            <button className="btn" onClick={() => open("history", id)}>
              <PlusIcon />
              수주·실패 이력 추가
            </button>
          )}
        </>
      )}
      <div className="chat-panel">
        <div>
          <Sparkles size={17} />
          <b>고객과의 대화에 물어보세요</b>
          <Badge tone="purple">AI MEMORY</Badge>
        </div>
        <div className="question-chips">
          {[
            "다시 연락해야 할까?",
            "예산이 바뀌었나요?",
            "누가 결정하나요?",
          ].map((text) => (
            <button
              key={text}
              onClick={() => {
                setQ(text);
                setResponse(answer(s, id, text));
              }}
            >
              {text}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) setResponse(answer(s, id, q));
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이 고객에 대해 궁금한 점을 물어보세요"
            aria-label="관계 기억 질문"
            required
          />
          <button className="send-button" aria-label="질문 보내기">
            <ArrowRight size={18} />
          </button>
        </form>
        {response && (
          <p className="chat-answer" aria-live="polite">
            {response}
          </p>
        )}
      </div>
      <div className="dialog-footer">
        <button className="btn" onClick={() => open("handover", id)}>
          <Users size={15} />
          AI 인수인계
        </button>
        <button className="btn primary" onClick={() => open("briefing", id)}>
          <Sparkles size={15} />
          미팅 브리핑
        </button>
      </div>
    </>
  );
}
function PlusIcon() {
  return <span style={{ fontSize: 19, lineHeight: 1 }}>+</span>;
}
function HistoryList({ id }: { id: string }) {
  const { s } = useStore();
  const entries = visibleHistory(s, id);
  return (
    <div className="history-list">
      {entries.map((h) => (
        <div className="brief-block" key={h.id}>
          <div className="history-heading">
            <Badge tone={h.outcome === "수주" ? "green" : "orange"}>
              {h.outcome}
            </Badge>
            <b>{h.amount.toLocaleString()}만 원</b>
            <small>{h.date}</small>
          </div>
          <p>{h.note}</p>
          <span className="muted">
            {h.scope === "team" ? "팀 공유" : "나만 보기"}
          </span>
        </div>
      ))}
      {!entries.length && <Empty>확인할 거래 이력이 없어요.</Empty>}
    </div>
  );
}
function Analysis({ id }: { id: string }) {
  const { s, update, open, notify } = useStore();
  const r = visibleRecords(s).find((r) => r.id === id);
  const [position, setPosition] = useState("00:12");
  if (!r) return <Empty>현재 보기에서 접근할 수 없는 기록이에요.</Empty>;
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (s.viewer !== "me") return;
    const f = new FormData(e.currentTarget);
    update((s) => ({
      ...s,
      records: s.records.map((x) =>
        x.id === id
          ? {
              ...x,
              self: String(f.get("self")).trim(),
              client: String(f.get("client")).trim(),
              customer: String(f.get("customer")),
              confirmed: true,
            }
          : x,
      ),
    }));
    notify("화자 연결을 확인하고 저장했어요.");
  }
  return (
    <>
      <h3 className="dialog-subtitle">{r.title}</h3>
      <p className="muted">
        {r.date} · {r.duration}
      </p>
      <div className="analysis-pipeline">
        {["음성 전사", "화자 분리", "핵심 정보 추출", "관계 반영"].map(
          (v, i) => (
            <span key={v}>
              <i>{i + 1}</i>
              {v}
              <Check size={13} />
            </span>
          ),
        )}
      </div>
      <div className="transcript-header">
        <h3>화자별 대화</h3>
        <Badge tone={r.confirmed ? "green" : "orange"}>
          {r.confirmed ? "화자 연결 확인됨" : "화자 연결 확인 필요"}
        </Badge>
      </div>
      {transcript(r).map((t, i) => (
        <div
          className={`transcript-row ${position === t.time ? "highlight" : ""}`}
          key={t.time}
        >
          <div className="transcript-top">
            <Avatar name={t.speaker} index={i === 0 ? 0 : 1} />
            <strong>{t.speaker}</strong>
            <button
              onClick={() => setPosition(t.time)}
              aria-label={`${t.time} 전사 선택`}
            >
              {t.time}
            </button>
          </div>
          <p>{t.text}</p>
        </div>
      ))}
      {s.viewer === "me" && (
        <form className="speaker-form" onSubmit={save}>
          <Field label="연결 고객">
            <select name="customer" defaultValue={r.customer}>
              {s.customers.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name} · {c.person}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-grid">
            <Field label={`화자 1 · 나 ${s.voice ? "(프로필 등록됨)" : ""}`}>
              <input
                name="self"
                required
                maxLength={30}
                defaultValue={r.self}
              />
            </Field>
            <Field label="화자 2 · 고객">
              <input
                name="client"
                required
                maxLength={30}
                defaultValue={r.client}
              />
            </Field>
          </div>
          <button className="btn small" type="submit">
            화자 연결 확인 · 저장
          </button>
        </form>
      )}
      <h3 className="section-label">AI가 기억한 6가지 핵심</h3>
      <div className="memory-grid">
        {Object.entries(labels).map(([key, label]) => (
          <div className="memory-block" key={key}>
            <span>
              {label} ·{" "}
              {key === "promise"
                ? "01:32"
                : key === "decision"
                  ? "02:10"
                  : key === "timing" || key === "signal"
                    ? "00:47"
                    : "00:28"}
            </span>
            <p>{r.fields[key as keyof Fields]}</p>
          </div>
        ))}
      </div>
      <div className="info-note">
        <Sparkles size={17} />
        샘플 전사와 정보 추출 결과가 관계 기억·타임라인·관계도·다음 행동에
        반영됐어요.
      </div>
      <div className="dialog-footer">
        {s.viewer === "me" && (
          <button
            className="btn"
            onClick={() =>
              update((s) => ({
                ...s,
                records: s.records.map((x) =>
                  x.id === r.id
                    ? { ...x, scope: x.scope === "team" ? "private" : "team" }
                    : x,
                ),
              }))
            }
          >
            {r.scope === "team" ? <Users size={15} /> : <Lock size={15} />}{" "}
            {r.scope === "team" ? "팀 공유" : "나만 보기"}
          </button>
        )}
        <button
          className="btn primary"
          onClick={() => open("customer", r.customer)}
        >
          관계 기억 확인
          <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
function RecordForm() {
  const { s, update, open, notify } = useStore();
  const [customer, setCustomer] = useState(s.customers[0].id),
    [scenario, setScenario] = useState("budget"),
    [scope, setScope] = useState<Scope>(s.team ? "team" : "private"),
    [running, setRunning] = useState(false),
    [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  if (s.viewer === "team")
    return <Empty>내 보기로 전환하면 새 대화를 기록할 수 있어요.</Empty>;
  const finish = () => {
    const r = newRecord(s, customer, scenario, "미팅", scope);
    if (!r) return;
    setRunning(false);
    update((s) => ({ ...s, records: [r, ...s.records] }));
    open("analysis", r.id);
    notify("분석 완료 · 관계 기억과 다음 행동에 반영했어요.");
  };
  return (
    <>
      <p className="dialog-description">
        고객과의 대화가 우리 팀의 기억이 됩니다.
        <br />
        <small>실제 마이크를 사용하지 않는 샘플 녹음 시연입니다.</small>
      </p>
      <div className={`recording-visual ${running ? "active" : ""}`}>
        <span className="mic-object">
          <Mic size={34} />
        </span>
        <Wave active={running} />
        <strong>
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:
          {String(seconds % 60).padStart(2, "0")}
        </strong>
        <span>
          {running
            ? "데모 미팅 진행 중 · 종료하면 분석 결과를 만들어요"
            : "대화를 기록할 준비가 되었어요"}
        </span>
      </div>
      <div className="form-grid">
        <Field label="연결 고객">
          <CustomerSelect value={customer} onChange={setCustomer} />
        </Field>
        <Field label="공유 범위">
          <ScopeSelect value={scope} onChange={setScope} />
        </Field>
      </div>
      <Field label="대화 시나리오">
        <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
          <option value="budget">예산 승인 · 계약 조건 검토</option>
          <option value="concern">비용 우려 · 단계별 도입 요청</option>
          <option value="initial">첫 미팅 · 요구사항 파악</option>
        </select>
      </Field>
      <div className="dialog-footer">
        <button className="btn" onClick={() => open("upload")}>
          <Upload size={16} />
          파일 가져오기
        </button>
        <button
          className="btn primary"
          onClick={() => (running ? finish() : setRunning(true))}
        >
          {running ? <Square size={14} /> : <Mic size={16} />}{" "}
          {running ? "종료하고 분석하기" : "데모 녹음 시작"}
        </button>
      </div>
    </>
  );
}
function UploadForm() {
  const { s, update, open, notify } = useStore();
  const [file, setFile] = useState<File | null>(null),
    [customer, setCustomer] = useState(s.customers[0].id);
  if (s.viewer === "team")
    return <Empty>내 보기로 전환하면 통화를 가져올 수 있어요.</Empty>;
  function submit(sample = false) {
    if (!sample && !file) {
      notify("녹음 파일을 선택해주세요.");
      return;
    }
    if (
      !sample &&
      file &&
      (file.size > 50 * 1024 * 1024 || !/\.(mp3|m4a|wav)$/i.test(file.name))
    ) {
      notify("50MB 이하의 MP3, M4A, WAV 파일을 선택해주세요.");
      return;
    }
    const r = newRecord(
      s,
      customer,
      "concern",
      "통화",
      s.team ? "team" : "private",
      sample ? undefined : file!.name,
    );
    if (r) {
      update((s) => ({ ...s, records: [r, ...s.records] }));
      open("analysis", r.id);
      notify("샘플 통화 분석을 완료했어요.");
    }
  }
  return (
    <>
      <p className="dialog-description">
        파일 선택 후 샘플 전사·분석 결과를 확인해보세요.
        <br />
        파일 내용은 읽거나 서버에 전송하지 않습니다.
      </p>
      <label className="dropzone">
        <Upload size={28} />
        <b>{file?.name || "통화 녹음 파일을 선택하세요"}</b>
        <span>MP3, M4A, WAV · 최대 50MB</span>
        <input
          type="file"
          accept=".mp3,.m4a,.wav"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>
      <Field label="연결 고객">
        <CustomerSelect value={customer} onChange={setCustomer} />
      </Field>
      <div className="dialog-footer">
        <button className="btn" onClick={() => submit(true)}>
          샘플로 체험
        </button>
        <button className="btn primary" onClick={() => submit()}>
          가져와서 데모 분석
          <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
}
function SearchPanel() {
  const { s, open } = useStore();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const customers = s.customers.filter((c) =>
    `${c.name} ${c.person}`.toLowerCase().includes(query),
  );
  const records = visibleRecords(s).filter((r) =>
    [r.title, ...Object.values(r.fields), ...transcript(r).map((t) => t.text)]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
  return (
    <>
      <label className="input-search dialog-search">
        <Search size={20} />
        <input
          autoFocus
          aria-label="고객과 대화 검색"
          placeholder="고객, 담당자, 대화 속 키워드를 검색하세요"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <kbd>ESC</kbd>
      </label>
      <p className="search-label">고객 · {customers.length}</p>
      {customers.map((c) => (
        <button
          className="search-result"
          key={c.id}
          onClick={() => open("customer", c.id)}
        >
          <Company c={c} />
          <ArrowUpRight size={17} />
        </button>
      ))}
      <p className="search-label">대화 · {records.length}</p>
      {records.map((r) => (
        <button
          className="search-result"
          key={r.id}
          onClick={() => open("analysis", r.id)}
        >
          <span className="soft-icon">
            <AudioLines size={19} />
          </span>
          <span>
            <strong>{r.title}</strong>
            <small>
              {r.date} · {r.kind}
            </small>
          </span>
          <ArrowUpRight size={17} />
        </button>
      ))}
      {!customers.length && !records.length && (
        <Empty>검색 결과가 없어요.</Empty>
      )}
    </>
  );
}
function MeetingForm() {
  const { s, modal, update, close, notify } = useStore();
  const [error, setError] = useState("");
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const m = Object.fromEntries(
      ["title", "customer", "date", "start", "end", "place"].map((k) => [
        k,
        String(f.get(k) || "").trim(),
      ]),
    ) as Omit<Meeting, "id">;
    const error = validateMeeting(m);
    if (error) {
      setError(error);
      return;
    }
    update((s) => ({ ...s, meetings: [...s.meetings, { ...m, id: uid() }] }));
    notify("새 미팅을 캘린더에 등록했어요.");
    close();
  }
  return (
    <form onSubmit={save}>
      <Field label="미팅 제목">
        <input
          name="title"
          required
          maxLength={80}
          placeholder="예: 노바테크 후속 제안 미팅"
        />
      </Field>
      <Field label="연결 고객">
        <CustomerSelect />
      </Field>
      <Field label="날짜">
        <input
          name="date"
          type="date"
          required
          defaultValue={modal?.id || s.clock.slice(0, 10)}
        />
      </Field>
      <div className="form-grid">
        <Field label="시작 시간">
          <input name="start" type="time" required defaultValue="14:00" />
        </Field>
        <Field label="종료 시간">
          <input name="end" type="time" required defaultValue="15:00" />
        </Field>
      </div>
      <Field label="미팅 장소">
        <input
          name="place"
          required
          maxLength={80}
          defaultValue="온라인 미팅"
        />
      </Field>
      <p className="muted">
        이 브라우저에 저장되며 외부 캘린더에는 전송되지 않습니다.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-footer">
        <button className="btn primary" type="submit">
          미팅 저장
          <Check size={16} />
        </button>
      </div>
    </form>
  );
}
function AddCustomer() {
  const { s, update, open, notify } = useStore();
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim(),
      person = String(f.get("person")).trim(),
      role = String(f.get("role")).trim();
    if (!name || !person || !role) return;
    const c = {
      ...s.customers[0],
      id: uid(),
      name,
      person,
      role,
      initial: name[0],
      industry: String(f.get("industry") || "미분류"),
      stage: "관계 형성",
      score: 1,
      need: "요구사항 확인 예정",
      price: "미확인",
      promise: "첫 미팅 일정 확인",
      timing: "미확인",
      title: "첫 미팅",
      location: String(f.get("address") || "").trim()
        ? { address: String(f.get("address")).trim(), regionCode: "" }
        : null,
    };
    update((s) => ({ ...s, customers: [...s.customers, c] }));
    notify("새 고객을 등록했어요.");
    open("customer", c.id);
  }
  return (
    <form onSubmit={save}>
      <Field label="고객사 이름">
        <input name="name" required maxLength={50} placeholder="예: 노바테크" />
      </Field>
      <div className="form-grid">
        <Field label="담당자 이름">
          <input name="person" required maxLength={30} placeholder="김민준" />
        </Field>
        <Field label="소속 및 직함">
          <input
            name="role"
            required
            maxLength={50}
            placeholder="사업개발팀 부장"
          />
        </Field>
      </div>
      <Field label="업종">
        <select name="industry">
          <option>IT · 솔루션</option>
          <option>제조 · 소재</option>
          <option>커머스 · 유통</option>
          <option>금융 · 보험</option>
          <option>기타</option>
        </select>
      </Field>
      <Field label="명함 주소 (선택)">
        <input
          name="address"
          maxLength={200}
          placeholder="시·도, 시·군·구, 읍·면·동을 포함한 주소"
        />
      </Field>
      <p className="muted">
        등록 후 고객 상세의 ‘명함 주소’에서 지도 위치를 확인할 수 있어요.
      </p>
      <div className="dialog-footer">
        <button className="btn primary">
          고객 등록
          <PlusIcon />
        </button>
      </div>
    </form>
  );
}
function ImportPanel() {
  const { s, update, notify, go } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const submit = (sample: boolean) => {
    if (!sample && (!file || !/\.(csv|xlsx|xls)$/i.test(file.name))) {
      notify("CSV 또는 엑셀 파일을 선택해주세요.");
      return;
    }
    const next = importCustomers(s);
    update(() => next);
    notify(
      `${next.customers.length - s.customers.length}개 고객과 거래 이력을 가져왔어요. 중복 항목은 제외했어요.`,
    );
    go("customers");
  };
  return (
    <>
      <p className="dialog-description">
        CSV·엑셀 가져오기 시연입니다.
        <br />
        선택한 파일은 분석하지 않으며 아래 샘플 2행을 가져옵니다.
      </p>
      <label className="dropzone">
        <FileText size={28} />
        <b>{file?.name || "고객 목록 파일 선택"}</b>
        <span>CSV, XLSX, XLS</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>
      <div className="table-wrap import-table">
        <table>
          <thead>
            <tr>
              <th>고객 / 담당자</th>
              <th>결과</th>
              <th>금액</th>
            </tr>
          </thead>
          <tbody>
            {importSamples.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.name}</b>
                  <small>{c.person}</small>
                </td>
                <td>
                  <Badge tone={c.outcome === "수주" ? "green" : "orange"}>
                    {c.outcome}
                  </Badge>
                </td>
                <td>{c.amount.toLocaleString()}만 원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="info-note">
        고객사 → 회사 · 담당자 → 연락처
        <br />
        결과·금액·사유 → 거래 이력 · 팀 공유로 저장
      </div>
      <div className="dialog-footer">
        <button className="btn" onClick={() => submit(true)}>
          샘플 2행 가져오기
        </button>
        <button className="btn primary" onClick={() => submit(false)}>
          선택 파일로 샘플 시연
        </button>
      </div>
    </>
  );
}
function HistoryForm({ id }: { id: string }) {
  const { s, update, open, notify } = useStore();
  if (s.viewer === "team")
    return <Empty>내 보기에서 거래 이력을 추가할 수 있어요.</Empty>;
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = Number(f.get("amount")),
      note = String(f.get("note")).trim();
    if (!note || !Number.isFinite(amount) || amount < 0 || amount > 100000000)
      return;
    update((s) => ({
      ...s,
      history: [
        {
          id: uid(),
          customer: id,
          date: s.clock.slice(0, 10),
          outcome: String(f.get("outcome")),
          amount,
          note,
          scope: f.get("scope") as Scope,
        },
        ...s.history,
      ],
    }));
    notify("거래 이력을 타임라인과 브리핑에 반영했어요.");
    open("customer", id, "history");
  }
  return (
    <form onSubmit={save}>
      <p className="dialog-description">
        {s.customers.find((c) => c.id === id)?.name}의 거래 결과를 관계 자산으로
        남겨주세요.
      </p>
      <div className="form-grid">
        <Field label="결과">
          <select name="outcome">
            <option>수주</option>
            <option>실패</option>
          </select>
        </Field>
        <Field label="금액 (만 원)">
          <input
            name="amount"
            type="number"
            min="0"
            max="100000000"
            defaultValue="1800"
            required
          />
        </Field>
      </div>
      <Field label="결과와 사유">
        <textarea
          name="note"
          required
          maxLength={200}
          placeholder="예: ERP 연동 지원과 단계별 도입안이 선정 이유"
        />
      </Field>
      <Field label="공유 범위">
        <ScopeSelect />
      </Field>
      <div className="dialog-footer">
        <button className="btn primary">
          거래 이력 저장
          <Check size={15} />
        </button>
      </div>
    </form>
  );
}
function Briefing({
  id,
  handover = false,
}: {
  id: string;
  handover?: boolean;
}) {
  const { s, open, close, notify } = useStore();
  const c = s.customers.find((c) => c.id === id)!;
  const r = latest(s, id);
  const pending = visibleRecords(s, id).filter((r) => !s.done.includes(r.id));
  const m = s.meetings
    .filter((m) => m.customer === id && m.date >= s.clock.slice(0, 10))
    .toSorted((a, b) => a.date.localeCompare(b.date))[0];
  const content = [
    `${c.name} · ${c.person}`,
    `지난 대화: ${r ? r.fields.need + " · " + r.fields.price : "확인 가능한 대화 없음"}`,
    `남은 약속: ${pending.map((r) => r.fields.promise).join(", ") || "없음"}`,
    `확인할 내용: ${r ? r.fields.timing + " · " + r.fields.decision : "첫 미팅에서 요구사항 확인"}`,
    ...visibleHistory(s, id).map(
      (h) => `${h.outcome} ${h.amount}만 원 · ${h.note}`,
    ),
  ].join("\n\n");
  function download() {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Flipside-${c.name}-${handover ? "인수인계" : "브리핑"}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("요약 파일을 다운로드했어요.");
  }
  return (
    <>
      <div className="briefing-hero">
        <span className="soft-icon">
          <Sparkles size={24} />
        </span>
        <div>
          <Badge>{handover ? "AI HANDOVER" : "MEETING BRIEF"}</Badge>
          <h3>
            {c.name} · {c.person}
          </h3>
          <p>
            {handover
              ? "새로운 담당자를 위한 고객 관계 요약"
              : m
                ? `${m.date} ${m.start} · ${m.title}`
                : "고객별 누적 대화 브리핑"}
          </p>
        </div>
      </div>
      <p className="muted">
        {s.viewer === "team" ? "팀에 공유된 기록" : "내가 볼 수 있는 기록"}{" "}
        {visibleRecords(s, id).length}건 기준 · 샘플 요약
      </p>
      <div className="brief-block">
        <span className="eyebrow">01 · RELATIONSHIP CONTEXT</span>
        <h3>지난 대화의 핵심</h3>
        <p>
          {r
            ? `${r.fields.need} · ${r.fields.price}`
            : "확인 가능한 대화가 없어요."}
        </p>
      </div>
      <div className="brief-block">
        <span className="eyebrow">02 · OPEN PROMISES</span>
        <h3>아직 남아 있는 약속</h3>
        {pending.length ? (
          pending.map((r) => (
            <p key={r.id}>
              <Check size={14} /> {r.fields.promise} <Badge>{r.dueDate}</Badge>
            </p>
          ))
        ) : (
          <p>남아 있는 후속 약속이 없어요.</p>
        )}
      </div>
      <div className="brief-block">
        <span className="eyebrow">03 · NEXT CONVERSATION</span>
        <h3>{handover ? "새 담당자가 확인할 내용" : "이번에 확인할 내용"}</h3>
        <p>
          {r
            ? `${r.fields.timing} · ${r.fields.decision}`
            : "첫 미팅에서 요구사항과 의사결정자를 확인하세요."}
        </p>
      </div>
      <div className="brief-block">
        <span className="eyebrow">04 · PAST EXPERIENCE</span>
        <h3>과거 거래에서 배운 점</h3>
        <HistoryList id={id} />
      </div>
      {r && (
        <button
          className="text-button blue-text"
          onClick={() => open("analysis", r.id)}
        >
          근거: {r.title} · 00:28 / 01:32 / 02:10
          <ArrowUpRight size={14} />
        </button>
      )}
      <div className="dialog-footer">
        <button className="btn" onClick={download}>
          <Download size={15} />
          요약 다운로드
        </button>
        <button className="btn primary" onClick={close}>
          확인 완료
          <Check size={15} />
        </button>
      </div>
    </>
  );
}
