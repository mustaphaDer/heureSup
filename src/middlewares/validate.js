/**
 * Request validation for the auth endpoints.
 *
 * The controllers previously assumed the JSON body was well formed, so a
 * missing field surfaced as a 500 from the database instead of a 400 to the
 * caller. These middleware run before the controller and return a stable
 * error shape: { error: string, details: string[] }.
 */

const ROLE_VALUES = ["admin", "teacher"];
const PAYMENT_TYPE_VALUES = ["ccp", "bank"];
const TEACHER_TYPE_VALUES = ["permanent", "vacataire", "outsider"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 8;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function fail(res, details) {
  return res.status(400).json({
    error: "Invalid request body",
    details,
  });
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const details = [];

  if (!isNonEmptyString(email)) {
    details.push("email is required");
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    details.push("email must be a valid address");
  }

  if (!isNonEmptyString(password)) {
    details.push("password is required");
  }

  if (details.length > 0) return fail(res, details);
  return next();
}

function validateSignup(req, res, next) {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    gradeID,
    paymentType,
    teacherType,
    accountNumber,
  } = req.body || {};

  const details = [];

  if (!isNonEmptyString(firstName)) details.push("firstName is required");
  if (!isNonEmptyString(lastName)) details.push("lastName is required");

  if (!isNonEmptyString(email)) {
    details.push("email is required");
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    details.push("email must be a valid address");
  }

  if (!isNonEmptyString(password)) {
    details.push("password is required");
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    details.push(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (!isNonEmptyString(role)) {
    details.push("role is required");
  } else if (!ROLE_VALUES.includes(role)) {
    details.push(`role must be one of: ${ROLE_VALUES.join(", ")}`);
  }

  if (role === "teacher") {
    if (gradeID === undefined || gradeID === null || Number.isNaN(Number(gradeID))) {
      details.push("gradeID is required for teachers and must be a number");
    }
    if (!PAYMENT_TYPE_VALUES.includes(paymentType)) {
      details.push(`paymentType must be one of: ${PAYMENT_TYPE_VALUES.join(", ")}`);
    }
    if (!TEACHER_TYPE_VALUES.includes(teacherType)) {
      details.push(`teacherType must be one of: ${TEACHER_TYPE_VALUES.join(", ")}`);
    }
    if (!isNonEmptyString(String(accountNumber ?? ""))) {
      details.push("accountNumber is required for teachers");
    }
  }

  if (details.length > 0) return fail(res, details);
  return next();
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  isNonEmptyString,
  validateLogin,
  validateSignup,
};
