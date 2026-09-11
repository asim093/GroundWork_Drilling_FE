const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

import { clockDuration } from './timeLogMath.js';
import { BLANK_ACTIVITY_LINE, BLANK_CONSUMABLE } from '../constants/timeLogs.js';

const toInputValue = (value) => (value === null || value === undefined ? '' : value);

const todayIso = () => new Date().toISOString().slice(0, 10);

const idOf = (value) => value?.id || value?._id || value || '';

export const emptyTimeLogForm = () => ({
  date: todayIso(),
  shift: null,
  crew: [],
  timeIn: '',
  timeOut: '',
  timeStarted: '',
  timeFinished: '',
  activityLines: [{ ...BLANK_ACTIVITY_LINE }],
  fuel: { dyedLt: '', dieselLt: '', gasolineLt: '' },
  consumables: [{ ...BLANK_CONSUMABLE }]
});

export const timeLogFormFromEntry = (entry) => ({
  date: entry.date ? entry.date.slice(0, 10) : todayIso(),
  shift: entry.shift || null,
  crew: (entry.crew || []).map((member) => ({
    employeeId: idOf(member.employeeId),
    timeIn: member.timeIn || '',
    timeOut: member.timeOut || ''
  })),
  timeIn: entry.timeIn || '',
  timeOut: entry.timeOut || '',
  timeStarted: entry.timeStarted || '',
  timeFinished: entry.timeFinished || '',
  activityLines: (entry.activityLines || []).map((line) => ({
    boreholeRef: line.boreholeRef || '',
    description: line.description || '',
    activityId: line.activityId?.id || line.activityId?._id || line.activityId || '',
    comments: line.comments || '',
    timeFrom: line.timeFrom || '',
    timeTo: line.timeTo || '',
    chargeTime: toInputValue(line.chargeTime),
    ncTime: toInputValue(line.ncTime)
  })),
  fuel: {
    dyedLt: toInputValue(entry.fuel?.dyedLt),
    dieselLt: toInputValue(entry.fuel?.dieselLt),
    gasolineLt: toInputValue(entry.fuel?.gasolineLt)
  },
  consumables: (entry.consumables || []).map((item) => ({
    itemName: item.itemName || '',
    qtyTaken: toInputValue(item.qtyTaken),
    qtyReturned: toInputValue(item.qtyReturned),
    qtyUsed: toInputValue(item.qtyUsed)
  }))
});

export const timeLogPayloadFromForm = (form) => ({
  date: form.date,
  shift: form.shift || null,
  crew: (form.crew || []).map((member) => ({
    employeeId: member.employeeId,
    timeIn: member.timeIn || '',
    timeOut: member.timeOut || ''
  })),
  timeIn: form.timeIn,
  timeOut: form.timeOut,
  timeStarted: form.timeStarted,
  timeFinished: form.timeFinished,
  hoursOnSite: clockDuration(form.timeIn, form.timeOut),
  activityLines: form.activityLines.map((line) => ({
    boreholeRef: line.boreholeRef,
    description: line.description,
    activityId: line.activityId || null,
    comments: line.comments || '',
    timeFrom: line.timeFrom,
    timeTo: line.timeTo,
    chargeTime: toNumberOrNull(line.chargeTime),
    ncTime: toNumberOrNull(line.ncTime)
  })),
  fuel: {
    dyedLt: toNumberOrNull(form.fuel.dyedLt),
    dieselLt: toNumberOrNull(form.fuel.dieselLt),
    gasolineLt: toNumberOrNull(form.fuel.gasolineLt)
  },
  consumables: form.consumables.map((item) => ({
    itemName: item.itemName,
    qtyTaken: toNumberOrNull(item.qtyTaken),
    qtyReturned: toNumberOrNull(item.qtyReturned),
    qtyUsed: toNumberOrNull(item.qtyUsed)
  }))
});
