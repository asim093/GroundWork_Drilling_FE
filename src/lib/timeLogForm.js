const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toInputValue = (value) => (value === null || value === undefined ? '' : value);

const todayIso = () => new Date().toISOString().slice(0, 10);

export const emptyTimeLogForm = () => ({
  date: todayIso(),
  shift: null,
  metersDrilled: '',
  metersRecovered: '',
  timeIn: '',
  timeOut: '',
  assistantName: '',
  assistantTimeIn: '',
  assistantTimeOut: '',
  timeStarted: '',
  timeFinished: '',
  hoursOnSite: '',
  standbyHours: '',
  otherHours: '',
  mileageStart: '',
  mileageEnd: '',
  mileageTotal: '',
  wellTag: { installed: false, decommissioned: false, locatesProvidedBy: '' },
  activityLines: [],
  fuel: { dyedLt: '', dieselLt: '', gasolineLt: '' },
  consumables: []
});

export const timeLogFormFromEntry = (entry) => ({
  date: entry.date ? entry.date.slice(0, 10) : todayIso(),
  shift: entry.shift || null,
  metersDrilled: toInputValue(entry.metersDrilled),
  metersRecovered: toInputValue(entry.metersRecovered),
  timeIn: entry.timeIn || '',
  timeOut: entry.timeOut || '',
  assistantName: entry.assistantName || '',
  assistantTimeIn: entry.assistantTimeIn || '',
  assistantTimeOut: entry.assistantTimeOut || '',
  timeStarted: entry.timeStarted || '',
  timeFinished: entry.timeFinished || '',
  hoursOnSite: toInputValue(entry.hoursOnSite),
  standbyHours: toInputValue(entry.standbyHours),
  otherHours: toInputValue(entry.otherHours),
  mileageStart: toInputValue(entry.mileageStart),
  mileageEnd: toInputValue(entry.mileageEnd),
  mileageTotal: toInputValue(entry.mileageTotal),
  wellTag: {
    installed: Boolean(entry.wellTag?.installed),
    decommissioned: Boolean(entry.wellTag?.decommissioned),
    locatesProvidedBy: entry.wellTag?.locatesProvidedBy || ''
  },
  activityLines: (entry.activityLines || []).map((line) => ({
    boreholeRef: line.boreholeRef || '',
    description: line.description || '',
    depth: toInputValue(line.depth),
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
  metersDrilled: toNumberOrNull(form.metersDrilled),
  metersRecovered: toNumberOrNull(form.metersRecovered),
  timeIn: form.timeIn,
  timeOut: form.timeOut,
  assistantName: form.assistantName,
  assistantTimeIn: form.assistantTimeIn,
  assistantTimeOut: form.assistantTimeOut,
  timeStarted: form.timeStarted,
  timeFinished: form.timeFinished,
  hoursOnSite: toNumberOrNull(form.hoursOnSite),
  standbyHours: toNumberOrNull(form.standbyHours),
  otherHours: toNumberOrNull(form.otherHours),
  mileageStart: toNumberOrNull(form.mileageStart),
  mileageEnd: toNumberOrNull(form.mileageEnd),
  mileageTotal: toNumberOrNull(form.mileageTotal),
  wellTag: {
    installed: Boolean(form.wellTag.installed),
    decommissioned: Boolean(form.wellTag.decommissioned),
    locatesProvidedBy: form.wellTag.locatesProvidedBy
  },
  activityLines: form.activityLines.map((line) => ({
    boreholeRef: line.boreholeRef,
    description: line.description,
    depth: toNumberOrNull(line.depth),
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
