import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Plus,
  Volume2,
  VolumeX,
  Send,
  Users,
  MessageSquare,
  X,
} from "lucide-react";
import { useStore } from "./store";
import { Head, CardHead, Avatar, Empty } from "./ui";
import "./meeting.css";

const stop = (m: MediaStream | null) => m?.getTracks().forEach((t) => t.stop());
const show = (m: MediaStream) => (el: HTMLVideoElement | null) => {
  if (el && el.srcObject !== m) el.srcObject = m;
};

// shortcut: only this browser's camera, mic and screen are shown, and chat stays in this tab; the other
// people's video, sound and messages need the backend (WebRTC signaling). Connect it in join() and send().
export default function MeetingPage() {
  const { s, user } = useStore();
  const [room, setRoom] = useState<{ title: string; guests: string[] } | null>(
    null,
  );
  const [cam, setCam] = useState<MediaStream | null>(null),
    [screen, setScreen] = useState<MediaStream | null>(null),
    [mic, setMic] = useState(true),
    [video, setVideo] = useState(true),
    // shortcut: nothing to mute yet; apply this to the remote <audio> elements once they exist.
    [sound, setSound] = useState(true),
    [chatOpen, setChatOpen] = useState(false),
    [chat, setChat] = useState<{ time: string; text: string }[]>([]),
    [draft, setDraft] = useState(""),
    [notice, setNotice] = useState("");
  const live = useRef<MediaStream[]>([]),
    inRoom = useRef(false),
    chatEnd = useRef<HTMLDivElement>(null);

  const leave = () => {
    inRoom.current = false;
    live.current.forEach(stop);
    live.current = [];
    setCam(null);
    setScreen(null);
    setRoom(null);
  };
  // Leaving the page must turn the camera off.
  useEffect(
    () => () => {
      inRoom.current = false;
      live.current.forEach(stop);
    },
    [],
  );
  useEffect(() => chatEnd.current?.scrollIntoView({ block: "nearest" }), [chat]);

  const join = async (title: string, guests: string[]) => {
    inRoom.current = true;
    setRoom({ title, guests });
    setMic(true);
    setVideo(true);
    setSound(true);
    setChat([]);
    setDraft("");
    setNotice("");
    try {
      const m = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      // The user may have left while the permission prompt was open.
      if (!inRoom.current) return stop(m);
      live.current.push(m);
      setCam(m);
    } catch {
      setNotice(
        "카메라와 마이크를 사용할 수 없어요. 브라우저 권한을 확인해주세요.",
      );
    }
  };
  const share = async () => {
    if (screen) {
      stop(screen);
      return setScreen(null);
    }
    try {
      const m = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (!inRoom.current) return stop(m);
      live.current.push(m);
      // The browser's own "stop sharing" button ends the track.
      m.getVideoTracks()[0].onended = () => setScreen(null);
      setScreen(m);
    } catch {
      // The user closed the screen picker.
    }
  };
  const toggle = (kind: "audio" | "video", on: boolean) => {
    cam
      ?.getTracks()
      .filter((t) => t.kind === kind)
      .forEach((t) => (t.enabled = on));
    if (kind === "audio") setMic(on);
    else setVideo(on);
  };
  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const time = new Date().toTimeString().slice(0, 5);
    setChat((c) => [...c, { time, text }]);
    setDraft("");
  };

  if (room) {
    // Index 0 is always me.
    const people = [user?.name || "나", ...room.guests];
    const face = (i: number) => (
      <>
        {i === 0 && cam && video ? (
          <video
            className="mirror"
            ref={show(cam)}
            autoPlay
            playsInline
            muted
          />
        ) : (
          <span className="meeting-wait">
            <Avatar name={people[i]} index={i} />
            {i > 0 && <small>연결 대기 중</small>}
          </span>
        )}
        <span className="meeting-name">
          {people[i]}
          {i === 0 && " (나)"}
          {i === 0 && !mic && <MicOff size={13} />}
        </span>
      </>
    );
    // Icon-only dock buttons; the label is the tooltip and the screen-reader name.
    const ctl = (
      label: string,
      icon: ReactNode,
      onClick: () => void,
      cls = "",
      disabled = false,
    ) => (
      <button
        className={cls}
        aria-label={label}
        data-tip={label}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
      </button>
    );
    return (
      <section className={`meeting-room ${chatOpen ? "chat-open" : ""}`}>
        <header>
          <h1>{room.title}</h1>
          <span className="meeting-count">
            <Users size={14} />
            {people.length}
          </span>
        </header>
        <div className="meeting-view">
          {screen ? (
            // While sharing, the screen is the big tile and everyone moves to a strip above it.
            <>
              <div className="meeting-strip">
                {people.map((_, i) => (
                  <div className="meeting-tile" key={i}>
                    {face(i)}
                  </div>
                ))}
              </div>
              <div className="meeting-tile">
                <video
                  className="contain"
                  ref={show(screen)}
                  autoPlay
                  playsInline
                  muted
                />
                <span className="meeting-name">내 화면 공유</span>
              </div>
            </>
          ) : (
            // Everyone gets an equal tile: 2 side by side, 3-4 in a 2x2 grid, more in 3 columns.
            <div className={`meeting-grid ${people.length > 4 ? "many" : ""}`}>
              {people.map((_, i) => (
                <div className="meeting-tile" key={i}>
                  {face(i)}
                </div>
              ))}
            </div>
          )}
        </div>
        {notice && (
          <p className="meeting-notice" role="alert">
            {notice}
          </p>
        )}
        <div className="meeting-controls">
          <div>
            {ctl(
              mic ? "음소거" : "음소거 해제",
              mic ? <Mic size={20} /> : <MicOff size={20} />,
              () => toggle("audio", !mic),
              mic ? "" : "off",
              !cam,
            )}
            {ctl(
              video ? "카메라 끄기" : "카메라 켜기",
              video ? <Video size={20} /> : <VideoOff size={20} />,
              () => toggle("video", !video),
              video ? "" : "off",
              !cam,
            )}
          </div>
          <div>
            {ctl(
              screen ? "화면 공유 중지" : "화면 공유하기",
              <MonitorUp size={20} />,
              share,
              screen ? "on" : "",
            )}
            {ctl(
              sound ? "소리 끄기" : "소리 켜기",
              sound ? <Volume2 size={20} /> : <VolumeX size={20} />,
              () => setSound(!sound),
              sound ? "" : "off",
            )}
            {ctl(
              chatOpen ? "채팅 닫기" : "채팅 열기",
              <MessageSquare size={20} />,
              () => setChatOpen(!chatOpen),
              chatOpen ? "on" : "",
            )}
          </div>
          {ctl("나가기", <PhoneOff size={22} />, leave, "end")}
        </div>
        {chatOpen && (
          <aside className="meeting-chat" aria-label="채팅">
            <header>
              <MessageSquare size={18} />
              <h2>채팅</h2>
              <button
                aria-label="닫기"
                title="닫기"
                onClick={() => setChatOpen(false)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="meeting-messages" aria-live="polite">
              <div className="meeting-welcome">
                <span>
                  <MessageSquare size={30} />
                </span>
                <strong>채팅에 오신 걸 환영합니다!</strong>
                <p>{room.title} 채팅의 시작이에요.</p>
              </div>
              {chat.map((m, i) => (
                <div className="meeting-message" key={i}>
                  <Avatar name={people[0]} />
                  <div>
                    <b>{people[0]}</b>
                    <small>{m.time}</small>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEnd} />
            </div>
            <form onSubmit={send}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="메시지 보내기"
                aria-label="메시지"
                maxLength={500}
              />
              <button aria-label="보내기" title="보내기" disabled={!draft.trim()}>
                <Send size={17} />
              </button>
            </form>
          </aside>
        )}
      </section>
    );
  }

  const upcoming = s.meetings
    .filter((m) => m.date >= s.clock.slice(0, 10))
    .toSorted((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 6);
  return (
    <>
      <Head
        title="화상 미팅"
        sub="고객과 얼굴을 보며 대화하고, 그 자리에서 관계를 이어가세요."
      >
        {/* shortcut: the group room is filled with customer contacts as stand-ins until the backend sends the real participant list. */}
        <button
          className="btn"
          onClick={() =>
            join(
              "그룹 미팅",
              s.customers.slice(0, 3).map((c) => c.person),
            )
          }
        >
          <Users size={16} />
          그룹 미팅 시작
        </button>
        <button
          className="btn primary"
          onClick={() => join("새 미팅", ["참석자"])}
        >
          <Plus size={16} />새 미팅 시작
        </button>
      </Head>
      <section className="card">
        <CardHead
          title="예정된 미팅"
          sub="캘린더에 등록한 미팅에 바로 참여하세요."
        />
        {upcoming.length ? (
          <ul className="meeting-list">
            {upcoming.map((m) => {
              const guest =
                s.customers.find((c) => c.id === m.customer)?.name || "참석자";
              return (
                <li key={m.id}>
                  <Avatar name={guest} />
                  <div>
                    <strong>{m.title}</strong>
                    <small>
                      {guest} · {m.date.slice(5).replace("-", ".")} {m.start}
                    </small>
                  </div>
                  <button
                    className="btn small primary"
                    onClick={() => join(m.title, [guest])}
                  >
                    <Video size={15} />
                    참여
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>예정된 미팅이 없어요. 캘린더에서 미팅을 등록해보세요.</Empty>
        )}
      </section>
    </>
  );
}
