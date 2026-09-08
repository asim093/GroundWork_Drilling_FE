import { ActionIcon, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { TimePicker } from '@mantine/dates';
import { NavIcon } from '../NavIcon.jsx';
import { lineDrilledMeters, lineHours } from '../../lib/timeLogMath.js';

const blankActivityLine = {
  boreholeRef: '',
  description: '',
  activityId: '',
  comments: '',
  depthFrom: '',
  depthTo: '',
  recoveryMeters: '',
  timeFrom: '',
  timeTo: '',
  chargeTime: '',
  ncTime: ''
};

const formatCalc = (value, suffix) =>
  value === null || value === undefined ? '—' : `${value}${suffix}`;

const notEmpty = (value) => value !== null && value !== undefined && value !== '';

const ERROR_LABELS = {
  activityId: 'Select an activity',
  depthTo: 'Depth to cannot be less than depth from',
  recoveryMeters: 'Recovery cannot exceed the drilled meters for this run'
};

export const ActivityLinesSection = ({ lines, onChange, disabled, errors, activityGroups = [] }) => {
  const updateLine = (index, patch) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    const previous = lines[lines.length - 1];
    onChange([
      ...lines,
      {
        ...blankActivityLine,
        depthFrom: previous?.depthTo ?? '',
        timeFrom: previous?.timeTo ?? '',
        autoDepthFrom: notEmpty(previous?.depthTo),
        autoTimeFrom: notEmpty(previous?.timeTo)
      }
    ]);
  };

  const removeLine = (index) => onChange(lines.filter((_, i) => i !== index));

  const errorList = Object.entries(errors || {}).flatMap(([index, fields]) =>
    Object.keys(fields || {}).map(
      (field) => `Line ${Number(index) + 1}: ${ERROR_LABELS[field] || 'Invalid value'}`
    )
  );

  const cellInput = (index, key, extra = {}) => (
    <NumberInput
      variant="unstyled"
      size="sm"
      hideControls
      min={0}
      placeholder="0"
      value={lines[index][key]}
      disabled={disabled}
      aria-label={extra.label}
      error={extra.hasError || undefined}
      onChange={(value) => updateLine(index, { [key]: value, ...(extra.clearAuto || {}) })}
    />
  );

  const timeCell = (index, key, extra = {}) => (
    <TimePicker
      variant="unstyled"
      size="sm"
      format="12h"
      withDropdown
      value={lines[index][key]}
      disabled={disabled}
      aria-label={extra.label}
      onChange={(value) =>
        updateLine(index, { [key]: value, ...(extra.clearAuto || {}) })
      }
    />
  );

  return (
    <Stack gap="sm">
      <div className="tlgrid-wrap">
        <table className="tlgrid tlgrid-wide">
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ minWidth: 230 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 116 }} />
            <col style={{ width: 116 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 82 }} />
            <col style={{ width: 74 }} />
            <col style={{ minWidth: 160 }} />
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>Activity</th>
              <th className="tlnum">Depth from</th>
              <th className="tlnum">Depth to</th>
              <th>Time from</th>
              <th>Time to</th>
              <th className="tlnum">Recovery</th>
              <th className="tlnum">Drilled</th>
              <th className="tlnum">Hours</th>
              <th>Comments</th>
              <th aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={11} className="tlgrid-empty">
                  No activity lines yet.
                </td>
              </tr>
            ) : null}

            {lines.map((line, index) => {
              const drilled = lineDrilledMeters(line);
              const hours = lineHours(line);
              const lineError = errors?.[index] || {};

              return (
                <tr key={index}>
                  <td className="tlidx">{index + 1}</td>
                  <td className={lineError.activityId ? 'tlcell-error' : undefined}>
                    <Select
                      variant="unstyled"
                      size="sm"
                      placeholder={line.description && !line.activityId ? line.description : 'Select activity'}
                      data={activityGroups}
                      value={line.activityId || null}
                      disabled={disabled}
                      searchable
                      error={Boolean(lineError.activityId) || undefined}
                      aria-label={`Line ${index + 1} activity`}
                      comboboxProps={{ width: 320, position: 'bottom-start' }}
                      onChange={(value) => updateLine(index, { activityId: value || '' })}
                    />
                  </td>
                  <td className={`tlnum${lineError.depthFrom ? ' tlcell-error' : ''}`}>
                    {line.autoDepthFrom ? (
                      <div className="tlcell-auto">
                        <span className="tlauto-tag">AUTO</span>
                        {cellInput(index, 'depthFrom', {
                          label: `Line ${index + 1} depth from`,
                          clearAuto: { autoDepthFrom: false }
                        })}
                      </div>
                    ) : (
                      cellInput(index, 'depthFrom', { label: `Line ${index + 1} depth from` })
                    )}
                  </td>
                  <td className={`tlnum${lineError.depthTo ? ' tlcell-error' : ''}`}>
                    {cellInput(index, 'depthTo', {
                      label: `Line ${index + 1} depth to`,
                      hasError: Boolean(lineError.depthTo)
                    })}
                  </td>
                  <td>
                    {line.autoTimeFrom ? (
                      <div className="tlcell-auto">
                        <span className="tlauto-tag">AUTO</span>
                        {timeCell(index, 'timeFrom', {
                          label: `Line ${index + 1} time from`,
                          clearAuto: { autoTimeFrom: false }
                        })}
                      </div>
                    ) : (
                      timeCell(index, 'timeFrom', { label: `Line ${index + 1} time from` })
                    )}
                  </td>
                  <td>{timeCell(index, 'timeTo', { label: `Line ${index + 1} time to` })}</td>
                  <td className={`tlnum${lineError.recoveryMeters ? ' tlcell-error' : ''}`}>
                    {cellInput(index, 'recoveryMeters', {
                      label: `Line ${index + 1} recovery`,
                      hasError: Boolean(lineError.recoveryMeters)
                    })}
                  </td>
                  <td className="tlnum tlcomputed">{formatCalc(drilled, ' m')}</td>
                  <td className="tlnum tlcomputed">{formatCalc(hours, ' h')}</td>
                  <td>
                    <TextInput
                      variant="unstyled"
                      size="sm"
                      placeholder="Optional note"
                      value={line.comments}
                      disabled={disabled}
                      aria-label={`Line ${index + 1} comments`}
                      onChange={(event) =>
                        updateLine(index, { comments: event.currentTarget.value })
                      }
                    />
                  </td>
                  <td className="tldelcell">
                    {disabled ? null : (
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        aria-label={`Remove line ${index + 1}`}
                        onClick={() => removeLine(index)}
                      >
                        <NavIcon name="trash" size={15} />
                      </ActionIcon>
                    )}
                  </td>
                </tr>
              );
            })}

            {disabled ? null : (
              <tr className="tlgrid-add">
                <td colSpan={11}>
                  <button type="button" onClick={addLine}>
                    + Add activity line
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Text size="xs" c="dimmed">
        Pick an <strong>Activity</strong> for every row; use <strong>Comments</strong> for any free
        text. Highlighted <strong>Drilled</strong> and <strong>Hours</strong> cells are calculated
        automatically. An <strong>AUTO</strong> tag means the value was carried over from the row
        above — you can still edit it.
      </Text>

      {errorList.length ? (
        <Stack gap={2}>
          {errorList.map((message) => (
            <Text key={message} size="xs" c="red">
              {message}
            </Text>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
};
