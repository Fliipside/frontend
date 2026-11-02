import { useState, type FormEvent } from "react";
import { ArrowRight, AudioLines, Network, Sparkles } from "lucide-react";
import { useStore } from "./store";
import {
  demoUser,
  findId,
  findIdErrors,
  logIn,
  loginErrors,
  requestPasswordReset,
  resetErrors,
  signUp,
  signupErrors,
  type SignupForm,
  type User,
} from "./auth";
import "./auth.css";

type Mode = "login" | "signup" | "find-id" | "reset";
const copy: Record<Mode, [string, string]> = {
  login: ["로그인", "팀의 관계 기억으로 돌아가요."],
  signup: ["회원가입", "몇 가지만 입력하면 바로 시작할 수 있어요."],
  "find-id": [
    "아이디 찾기",
    "가입할 때 적은 이름과 회사로 가입한 이메일을 찾아요.",
  ],
  reset: [
    "비밀번호 찾기",
    "가입한 이메일로 비밀번호 재설정 링크를 보내드려요.",
  ],
};
const empty: SignupForm = {
  name: "",
  company: "",
  email: "",
  password: "",
  confirm: "",
  agree: false,
};

function Field({
  id,
  label,
  error,
  ...input
}: {
  id: string;
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
      />
      {error && (
        <small id={`${id}-error`} role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
export default function AuthPage() {
  const { signIn, notify } = useStore();
  const [mode, setMode] = useState<Mode>("login");
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupForm, string>>
  >({});
  const [problem, setProblem] = useState("");
  const set =
    (key: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setF({
        ...f,
        [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      });
  const switchTo = (next: Mode) => {
    setMode(next);
    setErrors({});
    setProblem("");
  };
  const enter = (result: User | string, welcome: string) => {
    if (typeof result === "string") return setProblem(result);
    signIn(result);
    notify(`${welcome}, ${result.name}님`);
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    setProblem("");
    const found =
      mode === "login"
        ? loginErrors(f.email, f.password)
        : mode === "signup"
          ? signupErrors(f)
          : mode === "find-id"
            ? findIdErrors(f.name, f.company)
            : resetErrors(f.email);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (mode === "login")
      enter(await logIn(f.email, f.password), "다시 만나서 반가워요");
    else if (mode === "signup") enter(await signUp(f), "가입을 환영해요");
    else if (mode === "find-id") setProblem(await findId(f.name, f.company));
    else setProblem(await requestPasswordReset(f.email));
  }
  const login = mode === "login";
  return (
    <div className="auth">
      <aside className="auth-brand">
        <span className="brand-image">
          <img src="/brand/flipside-wordmark-no-dot.png" alt="Flipside" />
        </span>
        <div className="auth-copy">
          <h2>
            대화를 기억하고,
            <br />
            관계의 다음을 연결해요
          </h2>
          <ul>
            <li>
              <AudioLines size={17} />
              미팅·통화를 녹음하면 요구사항과 약속을 정리해요
            </li>
            <li>
              <Sparkles size={17} />
              근거가 있는 다음 행동을 알맞은 때에 추천해요
            </li>
            <li>
              <Network size={17} />
              누구를 통해 고객에게 닿을지 관계도로 보여줘요
            </li>
          </ul>
        </div>
      </aside>
      <main className="auth-main">
        <form className="auth-card" onSubmit={submit} noValidate>
          <h1>{copy[mode][0]}</h1>
          <p className="auth-sub">{copy[mode][1]}</p>
          {(mode === "signup" || mode === "find-id") && (
            <div className="auth-row">
              <Field
                id="name"
                label="이름"
                autoComplete="name"
                value={f.name}
                onChange={set("name")}
                error={errors.name}
              />
              <Field
                id="company"
                label="회사 또는 팀"
                autoComplete="organization"
                value={f.company}
                onChange={set("company")}
                error={errors.company}
              />
            </div>
          )}
          {mode !== "find-id" && (
            <Field
              id="email"
              label="이메일"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={f.email}
              onChange={set("email")}
              error={errors.email}
            />
          )}
          {(login || mode === "signup") && (
            <Field
              id="password"
              label="비밀번호"
              type="password"
              autoComplete={login ? "current-password" : "new-password"}
              placeholder={login ? "" : "영문과 숫자를 섞어 8자 이상"}
              value={f.password}
              onChange={set("password")}
              error={errors.password}
            />
          )}
          {mode === "signup" && (
            <>
              <Field
                id="confirm"
                label="비밀번호 확인"
                type="password"
                autoComplete="new-password"
                value={f.confirm}
                onChange={set("confirm")}
                error={errors.confirm}
              />
              <label className="auth-agree">
                <input
                  type="checkbox"
                  checked={f.agree}
                  onChange={set("agree")}
                  aria-invalid={!!errors.agree}
                  aria-describedby={errors.agree ? "agree-error" : undefined}
                />
                <span>
                  [필수] 개인정보 수집·이용에 동의해요. 녹음한 대화는 내가 정한
                  공유 범위 안에서만 쓰여요.
                </span>
              </label>
              {errors.agree && (
                <small id="agree-error" className="auth-error" role="alert">
                  {errors.agree}
                </small>
              )}
            </>
          )}
          {problem && (
            <p className="auth-problem" role="alert">
              {problem}
            </p>
          )}
          <button className="btn primary auth-submit">
            {
              {
                login: "로그인",
                signup: "가입하고 시작하기",
                "find-id": "아이디 찾기",
                reset: "재설정 링크 받기",
              }[mode]
            }
            <ArrowRight size={16} />
          </button>
          {login ? (
            <p className="auth-find">
              <button type="button" onClick={() => switchTo("find-id")}>
                아이디 찾기
              </button>
              <button type="button" onClick={() => switchTo("reset")}>
                비밀번호 찾기
              </button>
              <button type="button" onClick={() => switchTo("signup")}>
                회원가입
              </button>
            </p>
          ) : (
            <p className="auth-switch">
              {mode === "signup" ? "이미 계정이 있나요?" : "기억나셨나요?"}
              <button type="button" onClick={() => switchTo("login")}>
                로그인으로 돌아가기
              </button>
            </p>
          )}
          <div className="auth-demo">
            <span>또는</span>
            <button
              type="button"
              className="btn"
              onClick={() => enter(demoUser, "데모로 둘러보세요")}
            >
              데모 계정으로 둘러보기
            </button>
            <small>
              로그인과 회원가입은 서버 연결 후 열려요. 지금은 데모 계정으로
              둘러보세요.
            </small>
          </div>
        </form>
      </main>
    </div>
  );
}
