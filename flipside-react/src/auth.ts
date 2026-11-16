export type User = { name: string; email: string; company: string };
export type SignupForm = User & {
  password: string;
  confirm: string;
  agree: boolean;
};
type Errors<T> = Partial<Record<keyof T, string>>;

const emailOk = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
export const demoUser: User = {
  name: "이지원",
  email: "demo@flipside.app",
  company: "Flipside 영업팀",
};

export function loginErrors(email: string, password: string) {
  const errors: Errors<{ email: string; password: string }> = {};
  if (!emailOk(email)) errors.email = "이메일 형식을 확인해주세요.";
  if (!password) errors.password = "비밀번호를 입력해주세요.";
  return errors;
}
export function signupErrors(f: SignupForm) {
  const errors: Errors<SignupForm> = {};
  if (!f.name.trim()) errors.name = "이름을 입력해주세요.";
  if (!f.company.trim()) errors.company = "회사 또는 팀 이름을 입력해주세요.";
  if (!emailOk(f.email)) errors.email = "이메일 형식을 확인해주세요.";
  if (
    f.password.length < 8 ||
    !/[A-Za-z]/.test(f.password) ||
    !/\d/.test(f.password)
  )
    errors.password = "영문과 숫자를 섞어 8자 이상으로 만들어주세요.";
  if (f.confirm !== f.password) errors.confirm = "비밀번호가 서로 달라요.";
  if (!f.agree)
    errors.agree = "개인정보 수집·이용에 동의해야 가입할 수 있어요.";
  return errors;
}

export function findIdErrors(name: string, company: string) {
  const errors: Errors<{ name: string; company: string }> = {};
  if (!name.trim()) errors.name = "이름을 입력해주세요.";
  if (!company.trim())
    errors.company = "가입할 때 적은 회사 또는 팀 이름을 입력해주세요.";
  return errors;
}
export function resetErrors(email: string) {
  const errors: Errors<{ email: string }> = {};
  if (!emailOk(email)) errors.email = "이메일 형식을 확인해주세요.";
  return errors;
}

// Every backend answer, success or failure, has this shape; `message` is Korean and safe to show.
type Reply<T> =
  | { success: true; data: T }
  | { success: false; code: string; message: string };
type ApiUser = { id: string; email: string; nickname: string };
const TOKEN = "flipside-token";

// The path is relative on purpose: Nginx (production) and the Vite proxy (dev) forward /api to the backend.
async function call<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<Reply<T>> {
  try {
    const res = await fetch(`/api/v1${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch {
    // No network, the backend is down, or the answer was not JSON (a proxy error page).
    return {
      success: false,
      code: "NETWORK",
      message: "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.",
    };
  }
}

// Resolves the signed-in User, or the message to show when it failed.
export async function logIn(
  email: string,
  password: string,
): Promise<User | string> {
  const login = await call<{ access_token: string }>("/auth/login", {
    email: email.trim(),
    password,
  });
  if (!login.success) return login.message;
  // Login returns only a token, so the name comes from a second call.
  const token = login.data.access_token;
  const me = await call<ApiUser>("/auth/me", undefined, token);
  if (!me.success) return me.message;
  try {
    localStorage.setItem(TOKEN, JSON.stringify(token));
  } catch {
    // Storage blocked: the session simply lasts until the tab closes.
  }
  // shortcut: the API has no company field yet, so it is empty after a login; read it from /auth/me once the backend stores it.
  return { name: me.data.nickname, email: me.data.email, company: "" };
}
// Resolves "" when the account was created, or the message to show when it failed.
// It does not sign in: the user logs in with the new account on the login screen.
export async function signUp(form: SignupForm): Promise<string> {
  // shortcut: the company typed at signup is dropped (no API field yet); send it once the backend stores it.
  const signup = await call<ApiUser>("/auth/signup", {
    email: form.email.trim(),
    password: form.password,
    nickname: form.name.trim(),
  });
  return signup.success ? "" : signup.message;
}
// True only when the server rejects the saved token (expired, or the account was deactivated).
// A demo session has no token, and a network failure is not a rejection, so both stay signed in.
export async function sessionRejected() {
  const token = read<string | null>(TOKEN, null);
  if (!token) return false;
  const me = await call<ApiUser>("/auth/me", undefined, token);
  return (
    !me.success && (me.code === "UNAUTHORIZED" || me.code === "INACTIVE_USER")
  );
}
// Resolve the message to show: the masked email for findId, the "link sent" notice for reset.
export async function findId(_name: string, _company: string): Promise<string> {
  return "아이디 찾기는 서버 연결 후 열려요. 지금은 데모 계정으로 둘러보세요.";
}
export async function requestPasswordReset(_email: string): Promise<string> {
  return "비밀번호 재설정은 서버 연결 후 열려요. 지금은 데모 계정으로 둘러보세요.";
}

const read = <T>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
export const loadSession = () => read<User | null>("flipside-session", null);
export function saveSession(user: User | null) {
  try {
    if (user) localStorage.setItem("flipside-session", JSON.stringify(user));
    else {
      localStorage.removeItem("flipside-session");
      localStorage.removeItem(TOKEN);
    }
  } catch {
    // Storage blocked: the session simply lasts until the tab closes.
  }
}
