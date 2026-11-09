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

// Signup and login are empty shells until the FastAPI auth endpoints exist:
// replace these two bodies with the API calls (resolve a User, or an error message to show).
const notReady =
  "로그인과 회원가입은 서버 연결 후 열려요. 지금은 데모 계정으로 둘러보세요.";
export async function signUp(_form: SignupForm): Promise<User | string> {
  return notReady;
}
export async function logIn(
  _email: string,
  _password: string,
): Promise<User | string> {
  return notReady;
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
    else localStorage.removeItem("flipside-session");
  } catch {
    // Storage blocked: the session simply lasts until the tab closes.
  }
}
