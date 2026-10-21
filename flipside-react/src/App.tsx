import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  AudioLines,
  Network,
  Sparkles,
  CalendarDays,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  PanelLeftClose,
  Command,
  Mic,
  Check,
  ShieldCheck,
  CircleHelp,
  Download,
  Calendar,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { Provider, useStore } from "./store";
import { visibleRecords, visibleHistory } from "./model";
import {
  Badge,
  Avatar,
  Head,
  CardHead,
  Orb,
  ActionRow,
  CustomerTable,
  Timeline,
  MiniChart,
  Empty,
} from "./ui";
import {
  CustomersPage,
  RecordsPage,
  NetworkPage,
  ActionsPage,
  CalendarPage,
  SettingsPage,
} from "./pages";
import Dialogs from "./dialogs";
export const navigation = [
  { id: "overview", label: "오버뷰", icon: LayoutDashboard },
  { id: "customers", label: "고객 & 관계 기억", icon: Users },
  { id: "records", label: "대화 기록", icon: AudioLines },
  { id: "network", label: "관계도", icon: Network },
  { id: "actions", label: "다음 행동", icon: Sparkles },
  { id: "calendar", label: "캘린더", icon: CalendarDays },
];
function Dashboard() {
  const { s, open, go } = useStore();
  const [filter, setFilter] = useState("전체");
  const records = visibleRecords(s),
    pending = records.filter((r) => !s.done.includes(r.id));
  const upcoming = s.meetings
    .filter((m) => `${m.date}T${m.start}` >= s.clock)
    .toSorted((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
  const c = s.customers.find((c) => c.id === upcoming?.customer);
  const shared = records.filter((r) => r.scope === "team").length;
  const stages = ["관계 형성", "제안 검토", "협상 중"];

  return (
    <>
      <Head
        eyebrow="YOUR RELATIONSHIP OVERVIEW"
        title="좋은 아침이에요, 지원님"
        sub="오늘도 대화 속 기회를 발견하고, 관계의 다음을 이어가세요."
      >
        <span className="today">
          <CalendarDays size={15} />
          {s.clock.slice(0, 10).replaceAll("-", ". ")}
        </span>
        <button className="btn primary" onClick={() => open("record")}>
          <Plus size={17} />새 대화 기록
        </button>
      </Head>
      <div className="hero-layout">
        <section className="hero">
          <div className="hero-text">
            <div className="hero-eyebrow">
              <span className="spark-square">
                <Sparkles size={13} />
              </span>{" "}
              YOUR RELATIONSHIP COPILOT
            </div>
            <h2>
              좋은 관계의 다음에는,
              <br />
              <strong>새로운 기회가 있어요.</strong>
            </h2>
            <p>
              오늘 이어가면 좋을 관계 <b>{pending.length}건</b>을 찾았어요.
              <br />
              다음 대화의 시작, Flipside와 함께 준비하세요.
            </p>
            <button onClick={() => go("actions")}>
              오늘의 추천 확인하기 <ArrowUpRight size={17} />
            </button>
            <div className="hero-bottom">
              <span className="live-dot" />
              대화의 맥락을 이해하고 연결하고 있어요
            </div>
          </div>
          <Orb />
        </section>
        <section className="card upcoming">
          <CardHead title="다가오는 미팅">
            <button
              className="icon-button"
              onClick={() => go("calendar")}
              aria-label="캘린더 열기"
            >
              <ArrowUpRight size={17} />
            </button>
          </CardHead>
          {upcoming ? (
            <>
              <div className="meeting-intro">
                <div className="calendar-object">
                  <span>{Number(upcoming.date.slice(5, 7))}월</span>
                  <strong>{Number(upcoming.date.slice(8))}</strong>
                  <i />
                  <i />
                </div>
                <div>
                  <Badge tone="blue">
                    {upcoming.date === s.clock.slice(0, 10)
                      ? "오늘의 일정"
                      : upcoming.date}
                  </Badge>
                  <div className="meeting-time">
                    {upcoming.start}
                    <span> — {upcoming.end}</span>
                  </div>
                  <p>{upcoming.place}</p>
                </div>
              </div>
              <h3>{upcoming.title}</h3>
              <div className="meeting-people">
                <div className="avatar-stack">
                  <Avatar name="이지원" />
                  <Avatar name={c?.person || "고객"} index={1} />
                  <Avatar name="정수현" index={2} />
                </div>
                <span>{c?.person} 외 2명</span>
                <button
                  className="text-button"
                  onClick={() => open("meeting-detail", upcoming.id)}
                >
                  일정 상세
                  <ChevronRight size={13} />
                </button>
              </div>
              <button
                className="btn briefing-button"
                onClick={() => open("briefing", upcoming.customer)}
              >
                <Sparkles size={15} />
                AI 미팅 브리핑
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <Empty>
              예정된 미팅이 없어요.
              <button className="btn" onClick={() => open("meeting")}>
                미팅 등록
              </button>
            </Empty>
          )}
        </section>
      </div>
      <div className="metrics">
        {[
          {
            title: "연결된 고객",
            value: s.customers.length,
            unit: "곳",
            icon: Users,
            tag: "함께 성장하는 관계",
            tone: "blue",
            values: [14, 20, 18, 29, 32, 28, 40],
          },
          {
            title: "기억한 대화",
            value: records.length,
            unit: "건",
            icon: AudioLines,
            tag: `팀 공유 ${shared}건`,
            tone: "purple",
            values: [9, 19, 10, 32, 24, 46, 58],
          },
          {
            title: "오늘의 다음 행동",
            value: pending.length,
            unit: "건",
            icon: Sparkles,
            tag: `확정된 일정 ${s.confirmed.filter((id) => records.some((r) => r.id === id)).length}건`,
            tone: "orange",
            values: [52, 38, 54, 31, 42, 27, 20],
          },
          {
            title: "축적한 관계 기억",
            value: records.length * 6,
            unit: "개",
            icon: Network,
            tag: "대화에서 찾은 6가지 핵심",
            tone: "green",
            values: [7, 19, 17, 31, 37, 53, 72],
          },
        ].map((m, i) => (
          <button
            key={m.title}
            className="card metric"
            onClick={() =>
              go(["customers", "records", "actions", "network"][i])
            }
          >
            <div className="metric-top">
              <span>{m.title}</span>
              <span className={`metric-icon ${m.tone}`}>
                <m.icon size={17} />
              </span>
            </div>
            <div className="metric-data">
              <div>
                <strong>{String(m.value).padStart(2, "0")}</strong>
                <span>{m.unit}</span>
              </div>
              <MiniChart
                values={m.values}
                color={i === 3 ? "#45a894" : i === 2 ? "#64a5fa" : "#2375ff"}
              />
            </div>
            <div className="metric-bottom">
              <span className={`trend ${m.tone}`}>
                <ArrowUpRight size={12} />
                {i === 3 ? "자동 추출" : "실시간"}
              </span>
              <span>{m.tag}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="dashboard-mid">
        <section className="card action-card">
          <CardHead
            title="지금, 이어갈 관계"
            sub="대화 속 약속을 다음 행동으로 연결했어요."
          >
            <button className="text-button" onClick={() => go("actions")}>
              전체 보기
              <ChevronRight size={14} />
            </button>
          </CardHead>
          <div className="action-summary">
            <Sparkles size={16} />
            <b>{pending.length}개의 기회</b>가 다음 대화를 기다리고 있어요.
            <span>AI 추천</span>
          </div>
          {pending.slice(0, 3).map((r) => (
            <ActionRow key={r.id} r={r} />
          ))}
          {!pending.length && <Empty>모든 후속 행동을 완료했어요.</Empty>}
          <div className="card-note">
            <ShieldCheck size={14} />
            모든 추천은 실제 대화의 근거와 함께 제공돼요.
          </div>
        </section>
        <section className="card recent-card">
          <CardHead title="관계의 최근 흐름">
            <button
              className="icon-button"
              onClick={() => go("records")}
              aria-label="모든 대화 보기"
            >
              <ArrowUpRight size={16} />
            </button>
          </CardHead>
          <Timeline limit={3} />
          <button className="timeline-more" onClick={() => go("records")}>
            모든 대화 기록 보기
            <ArrowRight size={14} />
          </button>
        </section>
      </div>
      <div className="dashboard-customer-section">
        <section className="card customer-card">
          <CardHead title="나의 고객">
            <button className="text-button" onClick={() => go("customers")}>
              고객 관리
              <ArrowUpRight size={14} />
            </button>
          </CardHead>
          <div className="tabs compact">
            {["전체", ...stages].map((v) => (
              <button
                className={filter === v ? "active" : ""}
                key={v}
                onClick={() => setFilter(v)}
              >
                {v}
                {v === "전체" && <span>{s.customers.length}</span>}
              </button>
            ))}
          </div>
          <CustomerTable
            customers={s.customers.filter(
              (c) => filter === "전체" || c.stage === filter,
            )}
          />
        </section>

      </div>
    </>
  );
}
function Shell() {
  const { s, update, page, go, open, toast } = useStore();
  const [menu, setMenu] = useState(false);
  const pending = visibleRecords(s).filter(
    (r) => !s.done.includes(r.id),
  ).length;
  const current =
    page === "settings"
      ? "설정 및 공유 관리"
      : navigation.find((n) => n.id === page)?.label;
  return (
    <div className="app">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <button
          className="brand"
          aria-label="Flipside 홈"
          onClick={() => go("overview")}
        >
          <span className="brand-image">
            <img src="/brand/flipside-wordmark-no-dot.png" alt="Flipside" />
          </span>
        </button>
        <nav aria-label="주 메뉴">
          {navigation.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              aria-current={page === n.id ? "page" : undefined}
              onClick={() => {
                go(n.id);
                setMenu(false);
              }}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "actions" && <b className="nav-count">{pending}</b>}
              {n.id === "customers" && (
                <span className="nav-number">{s.customers.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="capture-card">
          <div className="capture-art">
            <span className="mic-object">
              <Mic size={26} />
            </span>
            <div className="mini-wave">
              {[12, 22, 32, 18, 27, 14, 23].map((h, i) => (
                <i key={i} style={{ height: h }} />
              ))}
            </div>
            <span className="capture-star">✧</span>
          </div>
          <h3>대화가 자산이 되는 순간</h3>
          <p>
            흩어진 대화를 모아,
            <br />
            우리 팀의 관계로 기억해요.
          </p>
          <button onClick={() => open("record")}>
            대화 기록하기
            <Plus size={15} />
          </button>
        </div>
        <button
          className={`sidebar-settings ${page === "settings" ? "active" : ""}`}
          onClick={() => {
            go("settings");
            setMenu(false);
          }}
        >
          <Settings size={18} />
          설정 및 공유 관리
        </button>
        <button className="sidebar-help" onClick={() => open("help")}>
          <CircleHelp size={18} />
          도움말 & 가이드
          <ArrowUpRight size={14} />
        </button>
        <button className="profile" onClick={() => open("profile")}>
          <Avatar name="이지원" />
          <span>
            <strong>이지원</strong>
            <small>영업팀 · 매니저</small>
          </span>
          <ChevronDown size={14} />
        </button>
      </aside>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="메뉴 닫기"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-only"
              aria-label="메뉴 열기"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <PanelLeftClose size={18} className="desktop-only" />
            <b>{current}</b>
          </div>
          <div className="topbar-tools">
            <button
              className="global-search"
              aria-label="고객과 대화 검색"
              onClick={() => open("search")}
            >
              <Search size={16} />
              <span>고객, 대화 검색</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="viewer"
              onClick={() =>
                update((s) => ({
                  ...s,
                  viewer: s.viewer === "me" ? "team" : "me",
                }))
              }
            >
              <Users size={14} />
              {s.viewer === "me" ? "내 보기" : "팀원 보기"}
              <ChevronDown size={12} />
            </button>
            <span className="demo-badge">
              <i />
              DEMO
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button notification"
              aria-label="알림"
              onClick={() => open("notifications")}
            >
              <Bell size={19} />
              {(pending > 0 || s.briefings.length > 0) && <i />}
            </button>
            <button
              className="avatar-button"
              onClick={() => open("profile")}
              aria-label="내 프로필"
            >
              <Avatar name="이지원" />
            </button>
          </div>
        </header>
        <main key={page}>
          {s.viewer === "team" && (
            <div className="viewer-banner">
              <ShieldCheck size={16} />
              팀에 공유된 기록만 보는 중이에요.
              <button onClick={() => update((s) => ({ ...s, viewer: "me" }))}>
                내 보기로 돌아가기
                <ArrowRight size={14} />
              </button>
            </div>
          )}
          {page === "overview" ? (
            <Dashboard />
          ) : page === "customers" ? (
            <CustomersPage />
          ) : page === "records" ? (
            <RecordsPage />
          ) : page === "network" ? (
            <NetworkPage />
          ) : page === "actions" ? (
            <ActionsPage />
          ) : page === "calendar" ? (
            <CalendarPage />
          ) : (
            <SettingsPage />
          )}
        </main>
        <footer>
          <span>
            <i />
            모든 관계에는 다음이 있습니다.
          </span>
          <span>Flipside · AI Relationship Intelligence</span>
        </footer>
      </div>
      <Dialogs />
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
export default function App() {
  return (
    <Provider>
      <Shell />
    </Provider>
  );
}
