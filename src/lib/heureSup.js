/**
 * Pure helpers for the "heure sup" (overtime) calculation.
 *
 * Everything in this module is free of database access so the charging rules
 * can be unit tested in isolation. The HTTP controller is responsible for
 * loading the data and persisting the results.
 */

export const DAY_ORDER = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Length of a seance in hours. Times are "HH:MM" (or "HH:MM:SS") strings.
 * A seance that ends before it starts yields a negative duration, which is the
 * historical behaviour and is intentionally preserved here.
 */
export function calculateTimeDifference(startTime, endTime) {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return (end - start) / (1000 * 60 * 60);
}

/** Sort seances by weekday first, then by start time. */
export function sortSeancesByDayAndTime(seances) {
  return [...seances].sort((a, b) => {
    if (DAY_ORDER[a.day] !== DAY_ORDER[b.day]) {
      return DAY_ORDER[a.day] - DAY_ORDER[b.day];
    }
    const aTime = new Date(`1970-01-01T${a.startTime}`);
    const bTime = new Date(`1970-01-01T${b.startTime}`);
    return aTime - bTime;
  });
}

/**
 * Distribute seances over a teacher's mandatory charge and report which hours
 * exceed it.
 *
 * Rules (matching the original implementation):
 *   - "cours" are charged first, then "td"/"tp", regardless of input order.
 *   - each seance counts as `duration * coefficient(type)` towards the charge.
 *   - a seance that fits entirely within the remaining charge is fully covered.
 *   - a seance that straddles the limit is split: only the hours beyond the
 *     remaining charge are overtime.
 *   - once the charge is filled, every further seance is overtime in full.
 *
 * The overtime hours are reported with the raw duration (not weighted), which
 * is what gets stored and paid.
 *
 * @param {Array} seances
 * @param {number} initialCharge charge already consumed before these seances
 * @param {number} maxCharge     the teacher's mandatory charge
 * @param {Map<string, number>} coefficientByType
 * @returns {{ calculatedCharge: number, allocations: Array<{seance: object, heureSupDuration: number}> }}
 */
export function allocateCharge(seances, initialCharge, maxCharge, coefficientByType) {
  let calculatedCharge = initialCharge;
  const allocations = [];

  const ordered = [
    ...seances.filter((seance) => seance.type === "cours"),
    ...seances.filter((seance) => seance.type === "td" || seance.type === "tp"),
  ];

  for (const seance of ordered) {
    const duration = calculateTimeDifference(seance.startTime, seance.endTime);
    // A missing coefficient previously produced NaN and corrupted the total;
    // fall back to 1 so a partially configured seance type cannot poison the
    // whole calculation.
    const coefficient = coefficientByType.get(seance.type) ?? 1;
    const weightedDuration = duration * coefficient;

    if (calculatedCharge + weightedDuration <= maxCharge) {
      calculatedCharge += weightedDuration;
      continue;
    }

    let heureSupDuration;
    if (calculatedCharge !== maxCharge) {
      heureSupDuration = duration - (maxCharge - calculatedCharge);
      calculatedCharge = maxCharge;
    } else {
      heureSupDuration = duration;
    }

    allocations.push({ seance, heureSupDuration });
  }

  return { calculatedCharge, allocations };
}
