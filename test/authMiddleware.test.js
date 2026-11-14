const test = require("node:test");
const assert = require("node:assert/strict");

const { validateLogin, validateSignup } = require("../src/middlewares/validate.js");
const { createRateLimiter } = require("../src/middlewares/rateLimit.js");

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function run(middleware, req) {
  const res = mockRes();
  let called = false;
  middleware(req, res, () => {
    called = true;
  });
  return { res, called };
}

test("validateLogin accepts a well formed body", () => {
  const { res, called } = run(validateLogin, {
    body: { email: "teacher@esi-sba.dz", password: "secret" },
  });

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});

test("validateLogin rejects a missing password", () => {
  const { res, called } = run(validateLogin, { body: { email: "a@b.co" } });

  assert.equal(called, false);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.details, ["password is required"]);
});

test("validateLogin rejects a malformed email", () => {
  const { res, called } = run(validateLogin, {
    body: { email: "not-an-email", password: "secret" },
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.details, ["email must be a valid address"]);
});

test("validateLogin does not enforce password strength on existing accounts", () => {
  const { called } = run(validateLogin, {
    body: { email: "a@b.co", password: "12345" },
  });

  assert.equal(called, true);
});

test("validateSignup accepts a complete admin body", () => {
  const { called } = run(validateSignup, {
    body: {
      firstName: "Mustapha",
      lastName: "Derrah",
      email: "m.derrah@esi-sba.dz",
      password: "longenough",
      role: "admin",
    },
  });

  assert.equal(called, true);
});

test("validateSignup rejects a short password", () => {
  const { res, called } = run(validateSignup, {
    body: {
      firstName: "A",
      lastName: "B",
      email: "a@b.co",
      password: "short",
      role: "admin",
    },
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.details.join(" "), /at least 8 characters/);
});

test("validateSignup requires the teacher specific fields", () => {
  const { res, called } = run(validateSignup, {
    body: {
      firstName: "A",
      lastName: "B",
      email: "a@b.co",
      password: "longenough",
      role: "teacher",
    },
  });

  assert.equal(called, false);
  const details = res.body.details.join(" ");
  assert.match(details, /gradeID/);
  assert.match(details, /paymentType/);
  assert.match(details, /teacherType/);
  assert.match(details, /accountNumber/);
});

test("validateSignup rejects an unknown role", () => {
  const { res, called } = run(validateSignup, {
    body: {
      firstName: "A",
      lastName: "B",
      email: "a@b.co",
      password: "longenough",
      role: "superuser",
    },
  });

  assert.equal(called, false);
  assert.match(res.body.details.join(" "), /role must be one of/);
});

test("the rate limiter allows requests up to the limit then returns 429", () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 2,
    keyGenerator: () => "fixed-key",
  });

  const first = run(limiter, {});
  const second = run(limiter, {});
  const third = run(limiter, {});

  assert.equal(first.called, true);
  assert.equal(second.called, true);
  assert.equal(third.called, false);
  assert.equal(third.res.statusCode, 429);
  assert.equal(third.res.headers["ratelimit-remaining"], "0");
  assert.ok(Number(third.res.headers["retry-after"]) > 0);
});

test("the rate limiter tracks each key separately", () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 1,
    keyGenerator: (req) => req.ip,
  });

  assert.equal(run(limiter, { ip: "1.1.1.1" }).called, true);
  assert.equal(run(limiter, { ip: "1.1.1.1" }).called, false);
  assert.equal(run(limiter, { ip: "2.2.2.2" }).called, true);
});
