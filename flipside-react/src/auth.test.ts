import { test } from "node:test";
import assert from "node:assert/strict";
import {
  confirmEmailCode,
  findIdErrors,
  logIn,
  loginErrors,
  requestEmailCode,
  requestPasswordReset,
  resetErrors,
  resetPassword,
  saveSession,
  sessionRejected,
  signUp,
  signupErrors,
} from "./auth";

const valid = {
  name: "김경진",
  company: "Flipside",
  email: "kj@flipside.app",
  code: "123456",
  password: "flip2026",
  confirm: "flip2026",
  agree: true,
};
test("a complete signup form has no errors", () => {
  assert.deepEqual(signupErrors(valid), {});
});
test("signup rejects weak passwords, mismatches, bad emails and missing consent", () => {
  const errors = signupErrors({
    ...valid,
    email: "kj@",
    password: "12345678",
    confirm: "x",
    agree: false,
  });
  assert.deepEqual(Object.keys(errors).sort(), [
    "agree",
    "confirm",
    "email",
    "password",
  ]);
  assert.ok(
    signupErrors({ ...valid, password: "abcdefgh", confirm: "abcdefgh" })
      .password,
  );
  assert.ok(signupErrors({ ...valid, name: "  " }).name);
});
test("login needs a valid email and a password", () => {
  assert.deepEqual(loginErrors("kj@flipside.app", "x"), {});
  assert.deepEqual(Object.keys(loginErrors("kj", "")).sort(), [
    "email",
    "password",
  ]);
});
test("finding an ID needs a name and a company", () => {
  assert.deepEqual(findIdErrors("김경진", "Flipside"), {});
  assert.deepEqual(Object.keys(findIdErrors(" ", "")).sort(), [
    "company",
    "name",
  ]);
});
test("a reset checks only the email first, then the code and the new password", () => {
  const weak = { ...valid, code: "12a", password: "abcdefgh", confirm: "x" };
  assert.deepEqual(resetErrors(weak, false), {});
  assert.ok(resetErrors({ ...weak, email: "kj@flipside" }, false).email);
  assert.deepEqual(Object.keys(resetErrors(weak, true)).sort(), [
    "code",
    "confirm",
    "password",
  ]);
  assert.deepEqual(resetErrors(valid, true), {});
});

// The backend is replaced by a fake fetch that records what the app sent.
function fakeBackend(replies: Record<string, unknown>) {
  const sent: { path: string; body: any; auth: string | undefined }[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
    const path = url.replace("/api/v1", "");
    sent.push({
      path,
      body: init.body ? JSON.parse(init.body as string) : undefined,
      auth: (init.headers as Record<string, string>).Authorization,
    });
    if (!(path in replies)) throw new TypeError("fetch failed");
    return { json: async () => replies[path] };
  }) as typeof fetch;
  return sent;
}
const ok = (data: unknown) => ({ success: true, code: "SUCCESS", data });
const me = ok({
  id: "1",
  email: "kj@flipside.app",
  nickname: "김경진",
  company: "Flipside",
});
const token = ok({ access_token: "tkn", token_type: "bearer", expires_in: 1 });

test("signup sends the name as nickname with the company, and does not sign in", async () => {
  const sent = fakeBackend({ "/auth/signup": me });
  assert.equal(
    await signUp({ ...valid, name: " 김경진 ", company: " Flipside " }),
    null,
  );
  assert.deepEqual(sent, [
    {
      path: "/auth/signup",
      body: {
        email: "kj@flipside.app",
        password: "flip2026",
        nickname: "김경진",
        company: "Flipside",
      },
      auth: undefined,
    },
  ]);
  fakeBackend({
    "/auth/signup": {
      success: false,
      code: "EMAIL_ALREADY_EXISTS",
      message: "이미 사용 중인 이메일입니다.",
      data: null,
    },
  });
  const failed = await signUp(valid);
  assert.equal(failed?.code, "EMAIL_ALREADY_EXISTS");
  assert.equal(failed?.message, "이미 사용 중인 이메일입니다.");
});
test("mail codes go to the verification and reset APIs, and failures show the server's message", async () => {
  const sent = fakeBackend({
    "/auth/email-verification/request": ok({ expires_in: 600, resend_after: 60 }),
    "/auth/email-verification/confirm": ok({ email: valid.email, expires_in: 1800 }),
    "/auth/password-reset/request": ok({ expires_in: 600, resend_after: 60 }),
    "/auth/password-reset/confirm": ok(null),
  });
  assert.equal(await requestEmailCode(" kj@flipside.app "), "");
  assert.equal(await confirmEmailCode("kj@flipside.app", " 123456 "), "");
  assert.equal(await requestPasswordReset("kj@flipside.app"), "");
  assert.equal(await resetPassword(valid), "");
  assert.deepEqual(
    sent.map((s) => s.body),
    [
      { email: "kj@flipside.app" },
      { email: "kj@flipside.app", code: "123456" },
      { email: "kj@flipside.app" },
      { email: "kj@flipside.app", code: "123456", new_password: "flip2026" },
    ],
  );
  fakeBackend({
    "/auth/email-verification/confirm": {
      success: false,
      code: "INVALID_EMAIL_CODE",
      message: "인증번호가 올바르지 않거나 만료되었습니다.",
      data: null,
    },
  });
  assert.equal(
    await confirmEmailCode("kj@flipside.app", "000000"),
    "인증번호가 올바르지 않거나 만료되었습니다.",
  );
});
test("login fetches the name and company with the new token", async () => {
  const sent = fakeBackend({ "/auth/login": token, "/auth/me": me });
  assert.deepEqual(await logIn(" kj@flipside.app ", "flip2026"), {
    name: "김경진",
    email: "kj@flipside.app",
    company: "Flipside",
  });
  assert.equal(sent[0].body.email, "kj@flipside.app");
  assert.equal(sent[1].auth, "Bearer tkn");
  // A backend from before the company field answers without it.
  fakeBackend({
    "/auth/login": token,
    "/auth/me": ok({ id: "1", email: "kj@flipside.app", nickname: "김경진" }),
  });
  const user = await logIn("kj@flipside.app", "flip2026");
  assert.equal(typeof user === "string" ? user : user.company, "");
});
test("a failed login shows the server's message; an unreachable server shows our own", async () => {
  fakeBackend({
    "/auth/login": {
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      data: null,
    },
  });
  assert.equal(
    await logIn("kj@flipside.app", "nope"),
    "이메일 또는 비밀번호가 올바르지 않습니다.",
  );
  fakeBackend({});
  assert.match((await logIn("kj@flipside.app", "x")) as string, /서버에 연결/);
});
test("a saved token is rejected only when the server says so", async () => {
  const saved = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => saved.get(k) ?? null,
    setItem: (k: string, v: string) => void saved.set(k, v),
    removeItem: (k: string) => void saved.delete(k),
  } as Storage;
  assert.equal(await sessionRejected(), false, "demo session: no token");
  fakeBackend({ "/auth/login": token, "/auth/me": me });
  await logIn("kj@flipside.app", "flip2026");
  assert.equal(await sessionRejected(), false, "valid token");
  fakeBackend({});
  assert.equal(await sessionRejected(), false, "offline is not a rejection");
  fakeBackend({
    "/auth/me": { success: false, code: "UNAUTHORIZED", message: "", data: null },
  });
  assert.equal(await sessionRejected(), true, "expired token");
  saveSession(null);
  assert.equal(saved.size, 0, "signing out forgets the token");
});
