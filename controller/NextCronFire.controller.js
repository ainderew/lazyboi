const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

function nextCronFire(_, res) {
  const nowManila = new Date(Date.now() + MANILA_OFFSET_MS);
  const candidates = [];

  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const day = new Date(nowManila);
    day.setUTCDate(nowManila.getUTCDate() + dayOffset);
    const dow = day.getUTCDay();

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

  res.json({
    nextFire: next.manilaTime.getTime() - MANILA_OFFSET_MS,
    mode: next.mode,
  });
}

export default nextCronFire;
