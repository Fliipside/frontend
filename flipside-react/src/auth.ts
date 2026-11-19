export type User = { name: string; email: string; company: string };
export type SignupForm = User & {
  // The 6-digit number mailed to prove the email (signup) or to allow a new password (reset).
  code: string;
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
  if (!f.agree)
    errors.agree = "개인정보 수집·이용에 동의해야 가입할 수 있어요.";
  return { ...errors, ...passwordErrors(f) };
}
// The same rule for a first password (signup) and a new one (reset).
function passwordErrors(f: SignupForm) {
  const errors: Errors<SignupForm> = {};
  if (
    f.password.length < 8 ||
    !/[A-Za-z]/.test(f.password) ||
    !/\d/.test(f.password)
  )
    errors.password = "영문과 숫자를 섞어 8자 이상으로 만들어주세요.";
  if (f.confirm !== f.password) errors.confirm = "비밀번호가 서로 달라요.";
  return errors;
}
export const codeError = (code: string) =>
  /^\d{6}$/.test(code.trim()) ? "" : "메일로 받은 숫자 6자리를 입력해주세요.";

export function findIdErrors(name: string, company: string) {
  const errors: Errors<{ name: string; company: string }> = {};
  if (!name.trim()) errors.name = "이름을 입력해주세요.";
  if (!company.trim())
    errors.company = "가입할 때 적은 회사 또는 팀 이름을 입력해주세요.";
  return errors;
}
// Before the code is sent only the email is checked; after that, the code and the new password too.
export function resetErrors(f: SignupForm, sent: boolean) {
  const errors: Errors<SignupForm> = {};
  if (!emailOk(f.email)) errors.email = "이메일 형식을 확인해주세요.";
  if (!sent) return errors;
  if (codeError(f.code)) errors.code = codeError(f.code);
  return { ...errors, ...passwordErrors(f) };
}

// Every backend answer, success or failure, has this shape; `message` is Korean and safe to show.
type Reply<T> =
  | { success: true; data: T }
  | { success: false; code: string; message: string };
// `company` is missing while the server still runs a backend from before that field existed.
type ApiUser = { id: string; email: string; nickname: string; company?: string };
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
  // Accounts created before the company field existed have none.
  return {
    name: me.data.nickname,
    email: me.data.email,
    company: me.data.company ?? "",
  };
}
// Resolves null when the account was created, or the failure: the page shows `message`, and
// `code` "EMAIL_NOT_VERIFIED" tells it the 30-minute verification ran out and must be redone.
// It does not sign in: the user logs in with the new account on the login screen.
export async function signUp(form: SignupForm) {
  const signup = await call<ApiUser>("/auth/signup", {
    email: form.email.trim(),
    password: form.password,
    nickname: form.name.trim(),
    company: form.company.trim(),
  });
  return signup.success ? null : signup;
}
// The four mail-code calls resolve "" on success, or the message to show when it failed.
const said = async (reply: Promise<Reply<unknown>>) => {
  const r = await reply;
  return r.success ? "" : r.message;
};
// Signup: mail a code to the address, then prove it. Only a proven address can sign up.
export const requestEmailCode = (email: string) =>
  said(call("/auth/email-verification/request", { email: email.trim() }));
export const confirmEmailCode = (email: string, code: string) =>
  said(
    call("/auth/email-verification/confirm", {
      email: email.trim(),
      code: code.trim(),
    }),
  );
// Reset: the server answers the same whether or not the address has an account, so nobody can probe for members.
export const requestPasswordReset = (email: string) =>
  said(call("/auth/password-reset/request", { email: email.trim() }));
export const resetPassword = (f: SignupForm) =>
  said(
    call("/auth/password-reset/confirm", {
      email: f.email.trim(),
      code: f.code.trim(),
      new_password: f.password,
    }),
  );
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
// shortcut: the backend has no find-ID API yet; connect it here to resolve the masked email.
export async function findId(_name: string, _company: string): Promise<string> {
  return "아이디 찾기는 서버 연결 후 열려요. 지금은 데모 계정으로 둘러보세요.";
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
