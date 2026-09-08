const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseClockHours = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  if (hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }
  return hours + minutes / 60 + seconds / 3600;
};

export const lineDrilledMeters = (line) => {
  const from = toNumber(line?.depthFrom);
  const to = toNumber(line?.depthTo);
  if (from === null || to === null) {
    return null;
  }
  return round2(to - from);
};

export const lineHours = (line) => {
  const from = parseClockHours(line?.timeFrom);
  const to = parseClockHours(line?.timeTo);
  if (from === null || to === null) {
    return null;
  }
  let diff = to - from;
  if (diff < 0) {
    diff += 24;
  }
  return round2(diff);
};

export const totalDrilledMeters = (lines) =>
  round2((lines || []).reduce((sum, line) => sum + (lineDrilledMeters(line) ?? 0), 0));

export const totalRecoveryMeters = (lines) => {
  const list = lines || [];
  const hasAny = list.some((line) => toNumber(line?.recoveryMeters) !== null);
  if (!hasAny) {
    return null;
  }
  return round2(list.reduce((sum, line) => sum + (toNumber(line?.recoveryMeters) || 0), 0));
};

export const totalLineHours = (lines) =>
  round2((lines || []).reduce((sum, line) => sum + (lineHours(line) ?? 0), 0));

export const mileageTotal = (start, end) => {
  const from = toNumber(start);
  const to = toNumber(end);
  if (from === null || to === null) {
    return null;
  }
  return round2(to - from);
};

export const shiftRecoveryPercent = (lines) => {
  const drilled = totalDrilledMeters(lines);
  const recovered = totalRecoveryMeters(lines);
  if (!drilled || drilled <= 0 || recovered === null) {
    return null;
  }
  return round2((recovered / drilled) * 100);
};

export const validateActivityLines = (lines) => {
  const errors = {};

  (lines || []).forEach((line, index) => {
    const from = toNumber(line?.depthFrom);
    const to = toNumber(line?.depthTo);
    const recovered = toNumber(line?.recoveryMeters);

    if (from !== null && to !== null && to < from) {
      errors[index] = {
        ...errors[index],
        depthTo: 'Depth to cannot be less than depth from'
      };
    }

    if (from !== null && to !== null && recovered !== null && recovered > to - from) {
      errors[index] = {
        ...errors[index],
        recoveryMeters: 'Recovery m cannot exceed the drilled meters for this run'
      };
    }
  });

  return Object.keys(errors).length ? errors : null;
};
