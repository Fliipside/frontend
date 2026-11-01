import { test } from "node:test";
import assert from "node:assert/strict";
import { findIdErrors, loginErrors, resetErrors, signupErrors } from "./auth";

const valid = {
  name: "김경진",
  company: "Flipside",
  email: "kj@flipside.app",
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
test("finding an ID needs a name and a company; a reset needs a valid email", () => {
  assert.deepEqual(findIdErrors("김경진", "Flipside"), {});
  assert.deepEqual(Object.keys(findIdErrors(" ", "")).sort(), [
    "company",
    "name",
  ]);
  assert.deepEqual(resetErrors("kj@flipside.app"), {});
  assert.ok(resetErrors("kj@flipside").email);
});
