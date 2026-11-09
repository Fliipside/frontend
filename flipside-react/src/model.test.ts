import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  newRecord,
  latest,
  visibleRecords,
  visibleHistory,
  answer,
  collectCalls,
  importCustomers,
  withBriefings,
  validateMeeting,
} from "./model";
test("new conversations drive memory and are excluded from the team view until shared", () => {
  let s = initialState();
  const r = newRecord(s, "nova", "budget", "미팅", "private")!;
  s.records.unshift(r);
  assert.equal(latest(s, "nova")?.id, r.id);
  assert.match(answer(s, "nova", "예산"), /3,600/);
  assert.equal(Object.keys(r.fields).length, 6);
  s.viewer = "team";
  assert.ok(!visibleRecords(s).some((x) => x.id === r.id));
  assert.doesNotMatch(answer(s, "nova", "예산"), /3,600/);
  assert.equal(visibleHistory(s, "green").length, 0);
  r.scope = "team";
  assert.match(answer(s, "nova", "예산"), /3,600/);
});
test("call collection obeys selected contacts, toggle, viewer and daily deduplication", () => {
  let s = initialState();
  s.contacts = ["nova"];
  s = collectCalls(s);
  assert.equal(s.records.length, 4);
  assert.equal(s.records[0].customer, "nova");
  assert.equal(collectCalls(s).records.length, 4);
  s.auto = false;
  assert.equal(collectCalls(s).records.length, 4);
  s.auto = true;
  s.viewer = "team";
  s.clock = "2026-10-22T13:00";
  assert.equal(collectCalls(s).records.length, 4);
  s.viewer = "me";
  assert.equal(collectCalls(s).records.length, 5);
});
test("customer imports include deal outcomes and are idempotent", () => {
  const s = importCustomers(initialState());
  assert.equal(s.customers.length, 6);
  assert.equal(s.history.length, 4);
  assert.equal(importCustomers(s).history.length, 4);
  assert.equal(importCustomers(s).customers.length, 6);
});
test("meeting validation catches impossible dates and reversed times", () => {
  const m = {
    title: "고객 미팅",
    customer: "nova",
    date: "2026-10-21",
    start: "14:00",
    end: "15:00",
    place: "온라인",
  };
  assert.equal(validateMeeting(m), "");
  assert.ok(validateMeeting({ ...m, end: "13:00" }));
  assert.ok(validateMeeting({ ...m, date: "2026-02-30" }));
  assert.ok(validateMeeting({ ...m, title: " " }));
});
test("briefings activate only in the 30 minute window and do not duplicate", () => {
  let s = initialState();
  assert.equal(withBriefings(s).briefings.length, 0);
  s.clock = "2026-10-21T13:30";
  s = withBriefings(s);
  assert.deepEqual(s.briefings, ["m0"]);
  assert.deepEqual(withBriefings(s).briefings, ["m0"]);
});
test("record source keys deduplicate and invalid customers are rejected", () => {
  const s = initialState();
  assert.equal(newRecord(s, "unknown", "budget", "미팅", "private"), null);
  const r = newRecord(
    s,
    "nova",
    "budget",
    "미팅",
    "team",
    undefined,
    "sample",
  )!;
  s.records.push(r);
  assert.equal(
    newRecord(s, "nova", "budget", "미팅", "team", undefined, "sample"),
    null,
  );
});
