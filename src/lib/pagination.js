/**
 * Shared query-string parsing for list endpoints.
 *
 * List endpoints historically returned every row. Pagination here is opt-in:
 * a request without `page`/`limit`/`offset` behaves exactly as before, while a
 * paginated request additionally receives a `pagination` block.
 */

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const PAGINATION_PARAMS = ["page", "limit", "offset"];

function toInteger(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return NaN;
  return parsed;
}

/**
 * True when the caller explicitly asked for pagination.
 */
function wantsPagination(query = {}) {
  return PAGINATION_PARAMS.some(
    (param) => query[param] !== undefined && query[param] !== ""
  );
}

/**
 * Normalise `page`, `limit` and `offset` into values safe to hand to the DB.
 * Out-of-range values are clamped rather than rejected, so a stale client
 * cannot crash an endpoint.
 *
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query = {}) {
  const requestedLimit = toInteger(query.limit);
  const requestedOffset = toInteger(query.offset);
  const requestedPage = toInteger(query.page);

  let limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  let offset;
  if (Number.isFinite(requestedOffset) && requestedOffset >= 0) {
    offset = requestedOffset;
  } else {
    const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
    offset = (page - 1) * limit;
  }

  return {
    page: Math.floor(offset / limit) + 1,
    limit,
    offset,
  };
}

/**
 * Build the `pagination` block returned to clients.
 */
function buildPaginationMeta({ page, limit, offset }, total, returned) {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    hasNextPage: offset + returned < total,
  };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  wantsPagination,
  parsePagination,
  buildPaginationMeta,
};
