import { useState } from "react";
import { ArrowRight, ArrowUpRight, AudioLines, CalendarDays, Check, ChevronRight, GitBranch, MapPin, Network, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useStore } from "./store";
import { decisions, latest, visibleRecords, type Customer } from "./model";
import { Avatar, Badge, Empty } from "./ui";
import { cardLocation } from "./geography";

export default function RelationshipGraph({ customer: c, onMap }: {
  customer: Customer;
  onMap?: () => void;
}) {
  const { s, open } = useStore();
  const [selected, setSelected] = useState("client");
  const [route, setRoute] = useState(false);
  const records = visibleRecords(s, c.id);
  const r = latest(s, c.id);
  const pending = records.filter(record => !s.done.includes(record.id));
  const next = pending.toSorted((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const meeting = s.meetings.filter(m => m.customer === c.id && `${m.date}T${m.start}` >= s.clock)
    .toSorted((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
  const people = r ? [
    { key: "me", name: r.self, role: "영업 담당", label: "직접 대화", detail: `${records.filter(x => x.self === r.self).length}건의 대화를 기록한 영업 담당자입니다. 고객과의 약속과 후속 업무를 연결합니다.`, side: "team" },
    { key: "staff", name: "정수현", role: "기술 검토 · 협업 담당", label: "협업 접점", detail: "기술 검토를 함께 진행하는 협업 담당자입니다. 소개 전에 고객과의 실제 연결 여부를 확인해주세요.", side: "team" },
    { key: "client", name: r.client, role: c.role, label: "주요 접점", detail: `${c.name}의 주요 대화 상대입니다. ${r.fields.need}`, side: "customer" },
    { key: "decision", name: decisions[c.id] || c.person, role: "의사결정 관련", label: "권한 확인", detail: r.fields.decision, side: "customer" },
  ] : [];
  const active = people.find(p => p.key === selected) || people[0];

  function personCard(index: number) {
    const person = people[index];
    return <button className={`flow-person ${selected === person.key ? "selected" : ""}`}
      aria-pressed={selected === person.key} aria-label={`${person.name} 관계 선택`}
      onClick={() => setSelected(person.key)}>
      <div className="flow-person-top"><Avatar name={person.name} index={index} />
        <span><strong>{person.name}</strong><small>{person.role}</small></span><ChevronRight size={16} /></div>
      <div className="flow-person-foot"><span className={`flow-status ${person.key === "decision" ? "review" : ""}`}><i />{person.label}</span>
        <span>{selected === person.key ? "선택됨" : "관계 보기"}</span></div>
    </button>;
  }
  return <div className="relationship-workspace">
    <div className="relationship-metrics">
      <div><span className="relationship-stat-icon"><AudioLines size={20} /></span><span>축적된 대화<strong>{records.length}<small>건</small></strong></span></div>
      <div><span className="relationship-stat-icon mint"><Users size={20} /></span><span>표시된 인물<strong>{new Set(people.map(p => p.name)).size}<small>명</small></strong></span></div>
      <div><span className="relationship-stat-icon amber"><Sparkles size={20} /></span><span>이어갈 행동<strong>{pending.length}<small>건</small></strong></span></div>
      <div><span className="relationship-stat-icon"><CalendarDays size={20} /></span><span>다음 미팅<strong className="relationship-date">{meeting ? meeting.date.slice(5).replace("-", ". ") : "미정"}<small>{meeting?.start}</small></strong></span></div>
    </div>
    <section className="card relationship-canvas">
      <div className="relationship-heading">
        <div><span className="eyebrow">RELATIONSHIP INTELLIGENCE</span><h2>{c.name}의 관계 네트워크</h2><p>누구와 이야기했고, 누구를 통해 다음 기회로 이어갈 수 있을까요?</p></div>
        <button className="relationship-address" onClick={() => open("customer", c.id, "address")}>
          <MapPin size={16} /><span><small>선택한 고객의 명함 주소</small><strong>{cardLocation(c)?.address || "주소를 등록해 지도에 연결하세요"}</strong></span><ChevronRight size={14} />
        </button>
      </div>
      {r ? <>
        <div className="relationship-toolbar">
          <div className="relationship-switch" aria-label="연결 표시 방식">
            <button aria-pressed={!route} onClick={() => setRoute(false)}><Network size={15} />전체 연결</button>
            <button aria-pressed={route} onClick={() => setRoute(true)}><GitBranch size={15} />소개 경로</button>
          </div>
          <div className="relationship-legend"><span><i />대화 접점</span><span><i className="dashed" />확인이 필요한 연결</span></div>
          <Badge>예시 관계 데이터</Badge>
        </div>
        <div className={`flow-board ${route ? "route-mode" : ""}`}>
          <div className="flow-group-label left"><Users size={14} />우리 팀 & 관계 기록<span>OUR TEAM</span></div>
          <div className="flow-group-label right"><Network size={14} />고객사 & 다음 기회<span>CUSTOMER</span></div>
          <svg className="flow-wires" viewBox="0 0 1000 510" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="relationship-wire" gradientUnits="userSpaceOnUse" x1="0" x2="1000" y1="0" y2="0"><stop stopColor="#9bc4f5" /><stop offset=".5" stopColor="#367add" /><stop offset="1" stopColor="#a1c9f5" /></linearGradient></defs>
            {[
              ["me", "M300 122 C425 122 395 262 500 262"],
              ["staff", "M300 262 C390 262 410 262 500 262"],
              ["source", "M300 402 C425 402 395 262 500 262"],
              ["client", "M500 262 C610 262 580 122 700 122"],
              ["decision", "M500 262 C590 262 610 262 700 262"],
              ["action", "M500 262 C610 262 580 402 700 402"],
            ].map(([key, d]) => <path key={key} d={d} className={`${key === selected ? "selected" : ""} ${people.some(p => p.key === key) ? "person-wire" : ""} ${key === "decision" || key === "staff" ? "inferred" : ""}`} />)}
            {[122,262,402].map(y => <g key={y}><circle cx="300" cy={y} r="5" /><circle cx="700" cy={y} r="5" /></g>)}
          </svg>
          <div className="flow-columns">
            <div className="flow-column">{personCard(0)}{personCard(1)}
              <button className="flow-source" onClick={() => open("analysis", r.id)}>
                <span className="flow-source-label"><AudioLines size={16} />최근 대화 기록<ArrowUpRight size={15} /></span>
                <strong>{r.title}</strong><small>{r.date} · {r.kind} · {r.scope === "team" ? "팀 공유" : "나만 보기"}</small>
                <span className="flow-wave" aria-hidden="true">{[10,22,16,28,36,20,30,14,24,34,18,26,12,20,10].map((height, i) => <i key={i} style={{height}} />)}</span>
              </button>
            </div>
            <div className="flow-hub">
              <span className="flow-hub-caption">함께 기억하는 관계</span>
              <button className="flow-hub-orb" onClick={() => open("customer", c.id)} aria-label={`${c.name} 관계 기억 열기`}>
                <img src="/brand/flipside-symbol.png" alt="" />
              </button>
              <strong>{c.name}</strong><span>{c.industry}</span><Badge>{c.stage}</Badge>
              <button className="flow-map-link" onClick={() => onMap ? onMap() : open("customer", c.id, "address")}><MapPin size={13} />{onMap ? "명함 위치로 이동" : "명함 주소 등록"}<ChevronRight size={13} /></button>
            </div>
            <div className="flow-column">{personCard(2)}{personCard(3)}
              <button className="flow-next" onClick={() => next ? open("evidence", next.id) : open("customer", c.id)}>
                <span className="flow-source-label"><Sparkles size={16} />{next ? "추천하는 다음 행동" : "후속 행동 완료"}<ArrowUpRight size={15} /></span>
                <strong>{next?.fields.promise || "약속한 행동을 모두 마쳤어요"}</strong>
                <small>{next ? `${next.dueDate} · 대화 근거 확인하기` : "고객 관계 기억 살펴보기"}</small>
              </button>
            </div>
          </div>
        </div>
        {route && <div className="relationship-route" aria-live="polite"><span><GitBranch size={17} />추천 소개 경로</span><div>{people.map((person, i) => <span key={person.key}><button onClick={() => setSelected(person.key)}>{person.name}</button>{i < people.length - 1 && <ArrowRight size={14} />}</span>)}</div><small>소개 가능 여부는 담당자에게 확인해주세요.</small></div>}
        <div className="relationship-detail" aria-live="polite">
          <div className="relationship-detail-person"><Avatar name={active.name} index={people.indexOf(active)} /><span><small>선택한 관계</small><strong>{active.name}</strong><span>{active.side === "team" ? "우리 팀" : c.name} · {active.role}</span></span></div>
          <div className="relationship-detail-copy"><strong><ShieldCheck size={16} />관계의 맥락</strong><p>{active.detail}</p><span>참고 대화 · {r.title} · {r.date}</span></div>
          <div className="relationship-detail-actions"><button className="btn" onClick={() => open("person", c.id, active.key)}>인물 상세<ArrowUpRight size={14} /></button><button className="text-button" onClick={() => open("analysis", r.id)}>근거 대화 확인<ChevronRight size={14} /></button></div>
        </div>
      </> : <Empty>현재 보기에서 확인할 대화가 없어요. 대화를 기록하면 관계가 연결됩니다.<button className="btn primary" onClick={() => open("record")}>새 대화 기록</button></Empty>}
    </section>
    {r && <div className="relationship-insights">
      <section className="card"><span className="relationship-insight-label"><ShieldCheck size={17} />의사결정 정보</span><h3>{decisions[c.id] || c.person}</h3><p>{r.fields.decision}</p><button className="text-button" onClick={() => open("intro", c.id)}>소개 경로 자세히<ArrowUpRight size={14} /></button></section>
      <section className="card"><span className="relationship-insight-label"><AudioLines size={17} />고객이 중요하게 여기는 것</span><h3>대화에서 발견한 요구사항</h3><p>{r.fields.need}</p><button className="text-button" onClick={() => open("customer", c.id)}>관계 기억 열기<ArrowUpRight size={14} /></button></section>
      <section className="card"><span className="relationship-insight-label"><Check size={17} />팀에 남는 관계 자산</span><h3>{records.filter(record => record.scope === "team").length}건의 공유된 대화</h3><p>현재 보기에서 확인할 수 있는 기록을 기준으로 관계를 구성합니다.</p><button className="text-button" onClick={() => open("handover", c.id)}>AI 인수인계 요약<ArrowUpRight size={14} /></button></section>
    </div>}
  </div>;
}
