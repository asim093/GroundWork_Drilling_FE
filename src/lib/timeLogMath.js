const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

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

export const formatClockHours = (value) => {
  let hours = Math.floor(value);
  let minutes = Math.round((value - hours) * 60);
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }
  hours %= 24;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const clockDuration = (from, to) => {
  const start = parseClockHours(from);
  const end = parseClockHours(to);
  if (start === null || end === null) {
    return null;
  }
  let diff = end - start;
  if (diff < 0) {
    diff += 24;
  }
  return round2(diff);
};

export const addClockHours = (value, delta) => {
  const hours = parseClockHours(value);
  if (hours === null) {
    return '';
  }
  let next = (hours + delta) % 24;
  if (next < 0) {
    next += 24;
  }
  let h = Math.floor(next);
  let m = Math.round((next - h) * 60);
  if (m === 60) {
    h = (h + 1) % 24;
    m = 0;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const lineHours = (line) => clockDuration(line?.timeFrom, line?.timeTo);

export const isWithinShift = (lineTime, timeIn, timeOut) => {
  const point = parseClockHours(lineTime);
  const start = parseClockHours(timeIn);
  let end = parseClockHours(timeOut);
  if (point === null || start === null || end === null) {
    return true;
  }
  if (end <= start) {
    end += 24;
  }
  let normalized = point;
  if (normalized < start) {
    normalized += 24;
  }
  return normalized >= start && normalized <= end;
};

export const totalLineHours = (lines) =>
  round2((lines || []).reduce((sum, line) => sum + (lineHours(line) ?? 0), 0));

const normalizeLineRanges = (lines, timeIn, timeOut) => {
  const start = parseClockHours(timeIn);
  let end = parseClockHours(timeOut);
  if (start === null || end === null) {
    return null;
  }
  if (end <= start) {
    end += 24;
  }

  const ranges = [];
  (lines || []).forEach((line, index) => {
    const from = parseClockHours(line?.timeFrom);
    const to = parseClockHours(line?.timeTo);
    if (from === null || to === null) {
      return;
    }
    const normFrom = from < start ? from + 24 : from;
    const normTo = to <= normFrom ? to + 24 : to;
    ranges.push({ index, from: normFrom, to: normTo });
  });

  return { start, end, ranges };
};

/** Returns { type: 'reversed', index } | { type: 'overlap', indexA, indexB } | null */
export const findActivityLineOverlap = (lines, timeIn, timeOut) => {
  const normalized = normalizeLineRanges(lines, timeIn, timeOut);
  if (!normalized) {
    return null;
  }
  const sorted = [...normalized.ranges].sort((a, b) => a.from - b.from);

  for (const line of sorted) {
    if (line.to <= line.from) {
      return { type: 'reversed', index: line.index };
    }
  }
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].from < sorted[i - 1].to) {
      return { type: 'overlap', indexA: sorted[i - 1].index, indexB: sorted[i].index };
    }
  }
  return null;
};

/** Returns the first uncovered { from, to } range (HH:MM strings) between timeIn and timeOut, or null. */
export const findActivityCoverageGap = (lines, timeIn, timeOut) => {
  const normalized = normalizeLineRanges(lines, timeIn, timeOut);
  if (!normalized) {
    return null;
  }
  const { start, end, ranges } = normalized;
  const sorted = [...ranges].sort((a, b) => a.from - b.from);

  let cursor = start;
  for (const range of sorted) {
    if (range.from > cursor) {
      return { from: formatClockHours(cursor % 24), to: formatClockHours(range.from % 24) };
    }
    if (range.to > cursor) {
      cursor = range.to;
    }
  }
  if (cursor < end) {
    return { from: formatClockHours(cursor % 24), to: formatClockHours(end % 24) };
  }
  return null;
};

export const validateActivityLines = (lines, shift = {}) => {
  const errors = {};
  const windowStart = shift.timeIn || shift.timeStarted;
  const windowEnd = shift.timeOut || shift.timeFinished;

  (lines || []).forEach((line, index) => {
    if (
      windowStart &&
      windowEnd &&
      line?.timeFrom &&
      !isWithinShift(line.timeFrom, windowStart, windowEnd)
    ) {
      errors[index] = {
        ...errors[index],
        timeFrom: 'Time from is outside the on-site window (Time In to Time Out)'
      };
    }

    if (
      windowStart &&
      windowEnd &&
      line?.timeTo &&
      !isWithinShift(line.timeTo, windowStart, windowEnd)
    ) {
      errors[index] = {
        ...errors[index],
        timeTo: 'Time to is outside the on-site window (Time In to Time Out)'
      };
    }
  });

  if (windowStart && windowEnd) {
    const overlap = findActivityLineOverlap(lines, windowStart, windowEnd);
    if (overlap?.type === 'reversed') {
      errors[overlap.index] = { ...errors[overlap.index], timeTo: 'Time to must be after time from' };
    } else if (overlap?.type === 'overlap') {
      errors[overlap.indexA] = { ...errors[overlap.indexA], timeTo: 'This line overlaps another activity line' };
      errors[overlap.indexB] = { ...errors[overlap.indexB], timeFrom: 'This line overlaps another activity line' };
    }
  }

  return Object.keys(errors).length ? errors : null;
};
