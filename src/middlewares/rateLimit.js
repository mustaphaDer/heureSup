/**
 * Minimal in-memory rate limiting for the auth endpoints.
 *
 * Deliberately dependency-free: the login endpoint previously had no
 * protection at all against credential stuffing, and adding a store would
 * mean a new service to run. This is a single-process fixed-window counter,
 * which is enough for a single-instance deployment. If the app is ever scaled
 * horizontally, swap the Map for Redis.
 */

const MAX_TRACKED_KEYS = 10000;

function createRateLimiter({ windowMs, max, keyGenerator, message }) {
  const hits = new Map();

  const sweep = () => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  };

  // Clean up expired windows so the map cannot grow without bound. unref() so
  // the timer never keeps the process (or a test run) alive.
  const timer = setInterval(sweep, windowMs);
  if (typeof timer.unref === "function") timer.unref();

  return function rateLimiter(req, res, next) {
    const key = keyGenerator(req);
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      if (hits.size >= MAX_TRACKED_KEYS) sweep();
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(retryAfterSeconds));

    if (entry.count > max) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: message || "Too many requests, please try again later",
      });
    }

    return next();
  };
}

function loginKey(req) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  // Keyed by IP *and* email so one attacker cannot lock out every account, and
  // spraying many emails from one IP is still throttled.
  return `login:${ip}:${email}`;
}

function signupKey(req) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `signup:${ip}`;
}

const LOGIN_WINDOW_MS = Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000;
const LOGIN_MAX = Number(process.env.RATE_LIMIT_LOGIN_MAX) || 10;
const SIGNUP_WINDOW_MS = Number(process.env.RATE_LIMIT_SIGNUP_WINDOW_MS) || 60 * 60 * 1000;
const SIGNUP_MAX = Number(process.env.RATE_LIMIT_SIGNUP_MAX) || 20;

const loginLimiter = createRateLimiter({
  windowMs: LOGIN_WINDOW_MS,
  max: LOGIN_MAX,
  keyGenerator: loginKey,
  message: "Too many login attempts, please try again later",
});

const signupLimiter = createRateLimiter({
  windowMs: SIGNUP_WINDOW_MS,
  max: SIGNUP_MAX,
  keyGenerator: signupKey,
  message: "Too many accounts created from this address, please try again later",
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  signupLimiter,
};
