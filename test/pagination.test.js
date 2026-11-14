const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  wantsPagination,
  parsePagination,
  buildPaginationMeta,
} = require("../src/lib/pagination.js");

test("parsePagination applies defaults when nothing is requested", () => {
  assert.deepEqual(parsePagination({}), {
    page: 1,
    limit: DEFAULT_LIMIT,
    offset: 0,
  });
});

test("parsePagination derives the offset from the page", () => {
  assert.deepEqual(parsePagination({ page: "3", limit: "10" }), {
    page: 3,
    limit: 10,
    offset: 20,
  });
});

test("parsePagination clamps the limit to the maximum", () => {
  assert.equal(parsePagination({ limit: "9999" }).limit, MAX_LIMIT);
});

test("parsePagination ignores non-numeric and non-positive input", () => {
  assert.equal(parsePagination({ limit: "abc" }).limit, DEFAULT_LIMIT);
  assert.equal(parsePagination({ limit: "0" }).limit, DEFAULT_LIMIT);
  assert.equal(parsePagination({ limit: "-5" }).limit, DEFAULT_LIMIT);
  assert.equal(parsePagination({ page: "-2" }).page, 1);
  assert.equal(parsePagination({ page: "0" }).page, 1);
});

test("parsePagination prefers an explicit offset over page", () => {
  assert.deepEqual(parsePagination({ offset: "30", limit: "10" }), {
    page: 4,
    limit: 10,
    offset: 30,
  });
});

test("wantsPagination only fires on real values", () => {
  assert.equal(wantsPagination({}), false);
  assert.equal(wantsPagination({ limit: "" }), false);
  assert.equal(wantsPagination({ page: "2" }), true);
  assert.equal(wantsPagination({ offset: "0" }), true);
  assert.equal(wantsPagination({ limit: "25" }), true);
});

test("buildPaginationMeta reports totals and whether more pages exist", () => {
  assert.deepEqual(buildPaginationMeta({ page: 1, limit: 10, offset: 0 }, 42, 10), {
    page: 1,
    limit: 10,
    total: 42,
    totalPages: 5,
    hasNextPage: true,
  });

  assert.deepEqual(buildPaginationMeta({ page: 5, limit: 10, offset: 40 }, 42, 2), {
    page: 5,
    limit: 10,
    total: 42,
    totalPages: 5,
    hasNextPage: false,
  });
});
