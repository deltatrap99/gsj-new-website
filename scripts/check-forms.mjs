import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const code = await readFile("supabase.js", "utf8");
async function exercise(kind, outcome = "success") {
  const values = {
    "contact-name": " Test Student ",
    "contact-email": " student@example.test ",
    "contact-subject": "study-abroad",
    "contact-message": "Consultation request",
    "question-name": "Test Student",
    "question-email": "student@example.test",
    "question-message": "How long is the research program?",
    "question-concern": "Time commitment",
    "mentor-first-name": "Test",
    "mentor-last-name": "Mentor",
    "mentor-email": "mentor@example.test",
    "mentor-phone": "123456",
    "mentor-project-title": "Research title",
    "mentor-project-overview": "Overview",
    "mentor-research-field": "Economics",
    "mentor-availability": "open",
    "mentor-mode": "remote",
    "mentor-experience": "yes",
    "mentor-responsibilities": "Tasks",
    "mentor-student-profile": "Curious",
    "mentor-skills": "Analysis",
    "mentor-time": "4-6",
    "mentor-additional": "Notes",
    "mentor-how-heard": "Website",
  };
  const submit = { innerHTML: "Submit", textContent: "", disabled: false };
  const feedback = {
    textContent: "",
    dataset: {},
    children: [],
    append(node) {
      this.children.push(node);
    },
  };
  let handler;
  let resets = 0;
  let calls = 0;
  let request;
  let resolveFetch;
  const form = {
    dataset: { form: kind },
    reportValidity: () => true,
    setAttribute() {},
    removeAttribute() {},
    reset() {
      resets++;
    },
    addEventListener(_, callback) {
      handler = callback;
    },
    querySelector(selector) {
      if (selector === '[type="submit"]') return submit;
      if (selector === ".form-feedback") return feedback;
      return { value: values[selector.slice(1)] || "" };
    },
  };
  runInNewContext(code, {
    document: { querySelectorAll: () => [form], createElement: () => ({}) },
    AbortSignal,
    fetch: (url, options) => {
      calls++;
      request = { url, ...options };
      return new Promise((resolve) => {
        resolveFetch = resolve;
      });
    },
  });
  const pending = handler({ preventDefault() {} });
  assert.equal(submit.disabled, true, "disable while submitting");
  await handler({ preventDefault() {} });
  assert.equal(calls, 1, "duplicate submission blocked");
  resolveFetch({ ok: outcome === "success" });
  await pending;
  assert.equal(submit.disabled, false, "restore submit button");
  assert.equal(form.dataset.submitting, "false");
  assert.equal(request.method, "POST");
  const payload = JSON.parse(request.body);
  assert.equal(
    payload.email,
    kind === "mentor" ? "mentor@example.test" : "student@example.test",
  );
  if (kind === "mentor") {
    assert.equal(Object.keys(payload).length, 16);
    assert.equal(payload.mode_of_engagement, "remote");
    assert.equal(payload.weekly_time_commitment, "4-6");
  }
  if (kind === "question")
    assert.match(payload.question, /Time commitment\n\nHow long/);
  if (kind === "contact") {
    assert.equal(payload.full_name, "Test Student");
    assert.equal(payload.subject, "study-abroad");
  }
  if (outcome === "success") {
    assert.equal(resets, 1);
    assert(feedback.textContent.length > 20);
  } else {
    assert.equal(resets, 0, "preserve visitor input after failure");
    assert.equal(feedback.dataset.error, "true");
    assert.equal(feedback.children.length, 1);
    assert(feedback.children[0].href.startsWith("mailto:info@gsj.edu.vn?"));
    assert(
      decodeURIComponent(feedback.children[0].href).includes(payload.email),
    );
  }
}
for (const kind of ["contact", "question", "mentor"]) {
  await exercise(kind);
  await exercise(kind, "failure");
}
console.log(
  "PASS: contact, question and mentor payloads; success/failure states; duplicate prevention; input preservation; email fallback. All network calls mocked.",
);
