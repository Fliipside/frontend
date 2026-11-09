import { seedCustomers } from "./seed";
import type { CardLocation } from "./geography";
export type Scope = "private" | "team";
export type Customer = (typeof seedCustomers)[number] & {
  location?: CardLocation | null;
};
export type Fields = {
  need: string;
  price: string;
  promise: string;
  timing: string;
  signal: string;
  decision: string;
};
export type RecordItem = {
  id: string;
  customer: string;
  title: string;
  date: string;
  duration: string;
  kind: "미팅" | "통화";
  scope: Scope;
  fields: Fields;
  dueDate: string;
  self: string;
  client: string;
  confirmed: boolean;
  sourceKey?: string;
};
export type Meeting = {
  id: string;
  customer: string;
  title: string;
  date: string;
  start: string;
  end: string;
  place: string;
};
export type History = {
  id: string;
  customer: string;
  date: string;
  outcome: string;
  amount: number;
  note: string;
  scope: Scope;
};
export type State = {
  customers: Customer[];
  records: RecordItem[];
  meetings: Meeting[];
  history: History[];
  done: string[];
  confirmed: string[];
  team: boolean;
  auto: boolean;
  voice: boolean;
  contacts: string[];
  viewer: "me" | "team";
  clock: string;
  briefings: string[];
};
export const labels: Record<keyof Fields, string> = {
  need: "고객 요구사항",
  price: "가격 · 예산 반응",
  promise: "기억해야 할 약속",
  timing: "구매 예상 시점",
  signal: "구매 신호",
  decision: "의사결정 구조",
};
export const decisions: Record<string, string> = {
  nova: "윤하늘 이사",
  green: "오지훈 본부장",
  bloom: "장예린 실장",
  atlas: "이정우 CTO",
};
export const uid = () => crypto.randomUUID();
export function fieldsFor(c: Customer, scenario = "initial"): Fields {
  const fields = {
    need: c.need,
    price: c.price,
    promise: c.promise,
    timing: c.timing,
    signal: "도입 사례와 구체적인 제안서를 요청함",
    decision: `${decisions[c.id] || c.person} · 예산 검토 담당, 최종 권한 확인 필요`,
  };
  if (scenario === "budget")
    return {
      ...fields,
      price: "연간 3,600만 원 예산 승인 · 2회 분할 납부 희망",
      promise: "최종 견적서와 분할 납부 조건 전달",
      timing: "10월 28일까지 계약 조건 검토",
      signal: "예산 승인 완료, 계약서 초안 요청",
      decision: `${decisions[c.id] || c.person} · 최종 결재자 확인`,
    };
  if (scenario === "concern")
    return {
      ...fields,
      price: "초기 비용 20% 절감 요청",
      promise: "범위를 나눈 2단계 도입안 전달",
      timing: "11월 첫째 주 재검토",
      signal: "도입 의향이 있으나 구축비가 장애 요인",
    };
  return fields;
}
export function initialState(): State {
  return {
    customers: seedCustomers,
    records: seedCustomers.slice(0, 3).map((c, i) => ({
      id: "r" + i,
      customer: c.id,
      title: c.title,
      date: ["2026-10-20", "2026-10-19", "2026-10-18"][i],
      duration: ["32분 18초", "12분 43초", "45분 06초"][i],
      kind: i === 1 ? "통화" : "미팅",
      scope: i === 1 ? "private" : "team",
      fields: fieldsFor(c),
      dueDate: ["2026-10-21", "2026-10-22", "2026-10-23"][i],
      self: "이지원",
      client: c.person,
      confirmed: false,
    })),
    meetings: seedCustomers.map((c, i) => ({
      id: "m" + i,
      customer: c.id,
      title: c.title,
      date: ["2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26"][i],
      start: ["14:00", "10:30", "15:00", "11:00"][i],
      end: ["15:00", "11:30", "16:00", "12:00"][i],
      place: i === 1 ? "그린웍스 본사" : "온라인 미팅",
    })),
    history: [
      {
        id: "h1",
        customer: "nova",
        date: "2026-07-28",
        outcome: "수주",
        amount: 1200,
        note: "ERP 연동 지원과 단계별 구축안이 선정 이유",
        scope: "team",
      },
      {
        id: "h2",
        customer: "green",
        date: "2026-08-21",
        outcome: "실패",
        amount: 2400,
        note: "초기 비용 부담으로 보류 · 단계별 도입안 필요",
        scope: "private",
      },
    ],
    done: [],
    confirmed: [],
    team: false,
    auto: true,
    voice: false,
    contacts: ["nova", "green", "bloom"],
    viewer: "me",
    clock: "2026-10-21T13:00",
    briefings: [],
  };
}
export function visibleRecords(s: State, customer?: string) {
  return s.records.filter(
    (r) =>
      (s.viewer === "me" || r.scope === "team") &&
      (!customer || r.customer === customer),
  );
}
export function visibleHistory(s: State, customer?: string) {
  return s.history.filter(
    (r) =>
      (s.viewer === "me" || r.scope === "team") &&
      (!customer || r.customer === customer),
  );
}
export function latest(s: State, c: string) {
  return visibleRecords(s, c).toSorted((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
}
export function transcript(r: RecordItem) {
  return [
    {
      time: "00:12",
      speaker: r.self,
      text: `오늘은 ${r.fields.need}에 대해 이야기 나누겠습니다.`,
    },
    {
      time: "00:28",
      speaker: r.client,
      text: `${r.fields.need}이 필요합니다. ${r.fields.price}.`,
    },
    {
      time: "00:47",
      speaker: r.client,
      text: `${r.fields.signal}. ${r.fields.timing}.`,
    },
    {
      time: "01:32",
      speaker: r.client,
      text: `${r.fields.promise} 부탁드립니다. ${r.dueDate}에 다시 연락주세요.`,
    },
    {
      time: "02:10",
      speaker: r.client,
      text: `${r.fields.decision}. 기술 검토는 정수현 님과 이어가겠습니다.`,
    },
  ];
}
export function answer(s: State, c: string, q: string) {
  const r = latest(s, c);
  if (!r) return "현재 보기에서 확인할 수 있는 대화가 없습니다.";
  const key: keyof Fields = /가격|예산|비용/.test(q)
    ? "price"
    : /누가|결재|결정/.test(q)
      ? "decision"
      : /언제|시점|일정/.test(q)
        ? "timing"
        : /신호|의향/.test(q)
          ? "signal"
          : /필요|요구/.test(q)
            ? "need"
            : "promise";
  return `최신 대화에 따르면 “${r.fields[key]}”입니다. ${key === "promise" ? `${r.dueDate}에 이 약속을 확인하며 다시 연락해보세요.` : ""}\n근거: ${r.title} · ${r.date} · ${key === "promise" ? "01:32" : key === "decision" ? "02:10" : key === "timing" || key === "signal" ? "00:47" : "00:28"}\n샘플 대화에 기반한 데모 답변입니다.`;
}
export function newRecord(
  s: State,
  c: string,
  scenario: string,
  kind: RecordItem["kind"],
  scope: Scope,
  title?: string,
  sourceKey?: string,
): RecordItem | null {
  const customer = s.customers.find((x) => x.id === c);
  if (
    !customer ||
    (sourceKey && s.records.some((r) => r.sourceKey === sourceKey))
  )
    return null;
  return {
    id: uid(),
    customer: c,
    title:
      title ||
      `${customer.name} ${scenario === "budget" ? "예산 확정" : "도입 범위 검토"} ${kind}`,
    date: s.clock.slice(0, 10),
    duration: "24분 18초 · 샘플",
    kind,
    scope,
    fields: fieldsFor(customer, scenario),
    dueDate: s.clock.slice(0, 10),
    self: "이지원",
    client: customer.person,
    confirmed: false,
    sourceKey,
  };
}
export function collectCalls(s: State): State {
  if (!s.auto || s.viewer !== "me") return s;
  let next = { ...s, records: [...s.records] };
  for (const c of s.customers.filter((c) => s.contacts.includes(c.id))) {
    const r = newRecord(
      next,
      c.id,
      "concern",
      "통화",
      s.team ? "team" : "private",
      `${c.name} · 자동 수집 통화`,
      `phone-${c.id}-${s.clock.slice(0, 10)}`,
    );
    if (r) next.records.unshift(r);
  }
  return next;
}
export function withBriefings(s: State): State {
  const ids = s.meetings
    .filter((m) => {
      const d = +new Date(`${m.date}T${m.start}`) - +new Date(s.clock);
      return d >= 0 && d <= 1800000;
    })
    .map((m) => m.id);
  return { ...s, briefings: [...new Set([...s.briefings, ...ids])] };
}
export function validateMeeting(m: Omit<Meeting, "id">) {
  if (!m.title.trim() || !m.place.trim()) return "제목과 장소를 입력해주세요.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(m.date) ||
    Number.isNaN(+new Date(m.date)) ||
    new Date(m.date).toISOString().slice(0, 10) !== m.date
  )
    return "올바른 날짜를 입력해주세요.";
  if (!m.start || !m.end || m.end <= m.start)
    return "종료 시간은 시작 시간보다 늦어야 합니다.";
  return "";
}
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const importSamples = [
  {
    id: "ever",
    name: "에버라인",
    person: "정지훈",
    outcome: "수주",
    amount: 1800,
    note: "유통 대시보드 구축 · 빠른 ERP 연동",
  },
  {
    id: "mono",
    name: "모노스튜디오",
    person: "한소희",
    outcome: "실패",
    amount: 900,
    note: "예산 축소 · 다음 분기 재검토",
  },
];
export function importCustomers(s: State): State {
  return {
    ...s,
    customers: [
      ...s.customers,
      ...importSamples
        .filter((c) => !s.customers.some((x) => x.id === c.id))
        .map((c) => ({
          ...seedCustomers[2],
          ...c,
          initial: c.name[0],
          role: "사업팀 매니저",
          industry: "기존 거래 고객",
        })),
    ],
    history: [
      ...s.history,
      ...importSamples
        .filter((c) => !s.history.some((x) => x.id === "import-" + c.id))
        .map((c) => ({
          id: "import-" + c.id,
          customer: c.id,
          date: "2026-09-18",
          outcome: c.outcome,
          amount: c.amount,
          note: c.note,
          scope: "team" as Scope,
        })),
    ],
  };
}
