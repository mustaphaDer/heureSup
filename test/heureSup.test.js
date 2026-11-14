import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateTimeDifference,
  sortSeancesByDayAndTime,
  allocateCharge,
} from "../src/lib/heureSup.js";

const COEFFICIENTS = new Map([
  ["cours", 1],
  ["td", 1.5],
  ["tp", 1.5],
]);

function seance(overrides = {}) {
  return {
    id: 1,
    day: "monday",
    startTime: "08:00",
    endTime: "10:00",
    type: "cours",
    ...overrides,
  };
}

test("calculateTimeDifference returns hours between two times", () => {
  assert.equal(calculateTimeDifference("08:00", "10:30"), 2.5);
  assert.equal(calculateTimeDifference("08:00", "08:00"), 0);
  assert.equal(calculateTimeDifference("14:00:00", "15:45:00"), 1.75);
});

test("sortSeancesByDayAndTime orders by weekday, then start time", () => {
  const sorted = sortSeancesByDayAndTime([
    seance({ id: 1, day: "tuesday", startTime: "08:00" }),
    seance({ id: 2, day: "monday", startTime: "14:00" }),
    seance({ id: 3, day: "monday", startTime: "08:00" }),
    seance({ id: 4, day: "sunday", startTime: "10:00" }),
  ]);

  assert.deepEqual(sorted.map((s) => s.id), [4, 3, 2, 1]);
});

test("sortSeancesByDayAndTime does not mutate its input", () => {
  const input = [
    seance({ id: 1, day: "tuesday" }),
    seance({ id: 2, day: "monday" }),
  ];
  sortSeancesByDayAndTime(input);

  assert.deepEqual(input.map((s) => s.id), [1, 2]);
});

test("seances that fit inside the charge are fully covered", () => {
  const result = allocateCharge([seance({ endTime: "10:00" })], 0, 10, COEFFICIENTS);

  assert.equal(result.calculatedCharge, 2);
  assert.deepEqual(result.allocations, []);
});

test("a seance landing exactly on the charge limit is covered", () => {
  const result = allocateCharge([seance({ endTime: "10:00" })], 0, 2, COEFFICIENTS);

  assert.equal(result.calculatedCharge, 2);
  assert.deepEqual(result.allocations, []);
});

test("a seance straddling the limit is split at the boundary", () => {
  // 3h seance against a 2h charge => 2h consumed, 1h overtime
  const result = allocateCharge(
    [seance({ id: 7, startTime: "08:00", endTime: "11:00" })],
    0,
    2,
    COEFFICIENTS
  );

  assert.equal(result.calculatedCharge, 2);
  assert.equal(result.allocations.length, 1);
  assert.equal(result.allocations[0].seance.id, 7);
  assert.equal(result.allocations[0].heureSupDuration, 1);
});

test("every seance is overtime once the charge is already filled", () => {
  const result = allocateCharge(
    [
      seance({ id: 1, endTime: "10:00" }),
      seance({ id: 2, endTime: "12:00" }),
    ],
    10,
    10,
    COEFFICIENTS
  );

  assert.equal(result.calculatedCharge, 10);
  assert.deepEqual(
    result.allocations.map((a) => [a.seance.id, a.heureSupDuration]),
    [
      [1, 2],
      [2, 4],
    ]
  );
});

test("cours are charged before td/tp regardless of input order", () => {
  // Both seances are 2h. With a 1h charge the first one processed gets the
  // single covered hour, so ordering determines the split: cours 2h => 1h
  // overtime, td 2h => 2h overtime.
  const result = allocateCharge(
    [
      seance({ id: 1, type: "td" }),
      seance({ id: 2, type: "cours" }),
    ],
    0,
    1,
    COEFFICIENTS
  );

  assert.deepEqual(
    result.allocations.map((a) => [a.seance.type, a.heureSupDuration]),
    [
      ["cours", 1],
      ["td", 2],
    ]
  );
});

test("coefficients weight the charge but not the paid overtime hours", () => {
  // 2h td at coefficient 1.5 consumes 3h of charge. With a 2h charge it
  // overflows by 1h weighted, and the overtime paid is the raw 2h duration
  // minus the 2h of remaining charge => 0h.
  const result = allocateCharge(
    [seance({ id: 1, type: "td" })],
    0,
    2,
    COEFFICIENTS
  );

  assert.equal(result.calculatedCharge, 2);
  assert.equal(result.allocations[0].heureSupDuration, 0);
});

test("a realistic week splits only the hours beyond the charge", () => {
  const result = allocateCharge(
    [
      seance({ id: 1, day: "monday", endTime: "10:00", type: "cours" }),
      seance({ id: 2, day: "tuesday", endTime: "10:00", type: "cours" }),
      seance({ id: 3, day: "wednesday", endTime: "11:00", type: "td" }),
      seance({ id: 4, day: "thursday", endTime: "10:00", type: "tp" }),
    ],
    0,
    10,
    COEFFICIENTS
  );

  // cours 2 + cours 2 + td 3*1.5 = 8.5, then tp 2*1.5 = 3 overflows by 1.5
  assert.equal(result.calculatedCharge, 10);
  assert.equal(result.allocations.length, 1);
  assert.equal(result.allocations[0].seance.id, 4);
  assert.equal(result.allocations[0].heureSupDuration, 0.5);
});

test("a missing coefficient falls back to 1 instead of corrupting the total", () => {
  const result = allocateCharge([seance({ endTime: "10:00" })], 0, 10, new Map());

  assert.equal(result.calculatedCharge, 2);
  assert.deepEqual(result.allocations, []);
});

test("no seances yields no overtime", () => {
  const result = allocateCharge([], 0, 10, COEFFICIENTS);

  assert.equal(result.calculatedCharge, 0);
  assert.deepEqual(result.allocations, []);
});
