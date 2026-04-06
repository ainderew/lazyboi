/**
 * Returns the next scheduled cron fire time as a UTC epoch ms.
 * Schedule (Asia/Manila, UTC+8, no DST):
 *  - In:  21:00 Mon-Fri
 *  - Out: 06:00 Tue-Sat
 */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

function nextCronFire(_, res) {
  const nowUtc = Date.now();
  // Shift "now" into Manila wall-clock so we can reason in local time
  const nowManila = new Date(nowUtc + MANILA_OFFSET_MS);

  const candidates = [];

  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const day = new Date(nowManila);
    day.setUTCDate(nowManila.getUTCDate() + dayOffset);
    const dow = day.getUTCDay(); // 0=Sun ... 6=Sat

    const makeTarget = (hour) => {
      const t = new Date(day);
      t.setUTCHours(hour, 0, 0, 0);
      return t;
    };

    if (dow >= 1 && dow <= 5) {
      const t = makeTarget(21);
      if (t.getTime() > nowManila.getTime()) {
        candidates.push({ mode: 'in', manilaTime: t });
      }
    }

    if (dow >= 2 && dow <= 6) {
      const t = makeTarget(6);
      if (t.getTime() > nowManila.getTime()) {
        candidates.push({ mode: 'out', manilaTime: t });
      }
    }
  }

  candidates.sort((a, b) => a.manilaTime - b.manilaTime);
  const next = candidates[0];

  if (!next) {
    return res.json({ nextFire: null, mode: null });
  }

  // Shift Manila wall-clock time back to real UTC epoch
  const nextFireUtc = next.manilaTime.getTime() - MANILA_OFFSET_MS;

  res.json({
    nextFire: nextFireUtc,
    mode: next.mode,
  });
}

export default nextCronFire;
