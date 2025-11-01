const { randomInt, randomUUID } = require('crypto');

function toDate(value) {
  return new Date(value);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function buildBusyBlock(start, end) {
  return {
    id: randomUUID(),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function getUserCalendarBusyTimes(userId, timeMin, timeMax) {
  // Mock implementation that simulates busy blocks similar to the FastAPI reference.
  const startDt = toDate(timeMin);
  const endDt = toDate(timeMax);
  const busyBlocks = [];
  let current = new Date(startDt);

  while (current < endDt) {
    const chance = Math.random();
    if (chance < 0.3) {
      const busyStart = new Date(current);
      const hours = randomInt(1, 4); // upper bound exclusive
      const busyEnd = addMinutes(busyStart, hours * 60);
      busyBlocks.push(
        buildBusyBlock(busyStart, busyEnd > endDt ? endDt : busyEnd)
      );
      current = busyEnd;
    } else {
      current = addMinutes(current, 60);
    }
  }

  return busyBlocks;
}

function findAvailableSlots({
  allBusyTimes,
  rangeStart,
  rangeEnd,
  durationMins,
  granularityMins,
  minCoverage,
  totalMembers,
}) {
  const startDt = toDate(rangeStart);
  const endDt = toDate(rangeEnd);
  const durationMs = durationMins * 60 * 1000;
  const granularityMs = granularityMins * 60 * 1000;
  const candidates = [];

  for (
    let current = new Date(startDt);
    current.getTime() + durationMs <= endDt.getTime();
    current = new Date(current.getTime() + granularityMs)
  ) {
    const slotStart = new Date(current);
    const slotEnd = new Date(slotStart.getTime() + durationMs);
    let availableCount = 0;

    Object.values(allBusyTimes).forEach((busyBlocks) => {
      const isAvailable = !busyBlocks?.some((busy) => {
        const busyStart = toDate(busy.start);
        const busyEnd = toDate(busy.end);
        return !(slotEnd <= busyStart || slotStart >= busyEnd);
      });
      if (isAvailable) {
        availableCount += 1;
      }
    });

    const coverageRatio = totalMembers > 0 ? availableCount / totalMembers : 0;

    if (coverageRatio >= minCoverage) {
      const hour = slotStart.getUTCHours();
      let timePrefScore = 1;
      if (hour >= 14 && hour <= 17) {
        timePrefScore = 1.2;
      } else if (hour < 9 || hour > 20) {
        timePrefScore = 0.5;
      }

      const score = coverageRatio * 0.7 + (timePrefScore / 1.2) * 0.3;

      candidates.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        score,
        available_members: availableCount,
        total_members: totalMembers,
        coverage_ratio: coverageRatio,
      });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

module.exports = {
  getUserCalendarBusyTimes,
  findAvailableSlots,
};
