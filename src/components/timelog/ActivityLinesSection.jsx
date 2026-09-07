import {
  Button,
  Card,
  Fieldset,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea
} from '@mantine/core';
import { lineDrilledMeters, lineHours } from '../../lib/timeLogMath.js';

const blankActivityLine = {
  boreholeRef: '',
  description: '',
  depthFrom: '',
  depthTo: '',
  recoveryMeters: '',
  timeFrom: '',
  timeTo: '',
  chargeTime: '',
  ncTime: ''
};

const GRID = { base: 1, sm: 2 };

const formatCalc = (value, suffix) =>
  value === null || value === undefined ? '—' : `${value}${suffix}`;

export const ActivityLinesSection = ({ lines, onChange, disabled, errors }) => {
  const updateLine = (index, key, value) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
  };

  const addLine = () => {
    const previous = lines[lines.length - 1];
    onChange([
      ...lines,
      {
        ...blankActivityLine,
        depthFrom: previous?.depthTo ?? '',
        timeFrom: previous?.timeTo ?? ''
      }
    ]);
  };

  const removeLine = (index) => onChange(lines.filter((_, i) => i !== index));

  return (
    <Fieldset legend="Activity lines (BH#)">
      <Stack gap="md">
        {lines.length === 0 ? (
          <Text c="dimmed" size="sm">
            No activity lines added yet.
          </Text>
        ) : null}

        {lines.map((line, index) => {
          const drilled = lineDrilledMeters(line);
          const hours = lineHours(line);
          const lineError = errors?.[index] || {};

          return (
            <Card key={index} withBorder radius="sm" p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} size="sm">
                    Line {index + 1}
                  </Text>
                  {disabled ? null : (
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-sm"
                      onClick={() => removeLine(index)}
                    >
                      Remove
                    </Button>
                  )}
                </Group>

                <TextInput
                  label="Borehole ref"
                  value={line.boreholeRef}
                  disabled={disabled}
                  onChange={(event) => updateLine(index, 'boreholeRef', event.currentTarget.value)}
                />
                <Textarea
                  label="Description"
                  autosize
                  minRows={2}
                  value={line.description}
                  disabled={disabled}
                  onChange={(event) => updateLine(index, 'description', event.currentTarget.value)}
                />

                <SimpleGrid cols={GRID} spacing="sm">
                  <NumberInput
                    label="Depth from (m)"
                    min={0}
                    value={line.depthFrom}
                    disabled={disabled}
                    onChange={(value) => updateLine(index, 'depthFrom', value)}
                  />
                  <NumberInput
                    label="Depth to (m)"
                    min={0}
                    value={line.depthTo}
                    disabled={disabled}
                    error={lineError.depthTo}
                    onChange={(value) => updateLine(index, 'depthTo', value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={GRID} spacing="sm">
                  <TextInput
                    label="Time from"
                    type="time"
                    value={line.timeFrom}
                    disabled={disabled}
                    onChange={(event) => updateLine(index, 'timeFrom', event.currentTarget.value)}
                  />
                  <TextInput
                    label="Time to"
                    type="time"
                    value={line.timeTo}
                    disabled={disabled}
                    onChange={(event) => updateLine(index, 'timeTo', event.currentTarget.value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={GRID} spacing="sm">
                  <TextInput label="Drilled (m)" value={formatCalc(drilled, ' m')} readOnly disabled />
                  <TextInput label="Hours" value={formatCalc(hours, ' h')} readOnly disabled />
                </SimpleGrid>

                <SimpleGrid cols={GRID} spacing="sm">
                  <NumberInput
                    label="Recovery m"
                    min={0}
                    value={line.recoveryMeters}
                    disabled={disabled}
                    error={lineError.recoveryMeters}
                    onChange={(value) => updateLine(index, 'recoveryMeters', value)}
                  />
                  <div />
                </SimpleGrid>

                <SimpleGrid cols={GRID} spacing="sm">
                  <NumberInput
                    label="Charge time (h)"
                    value={line.chargeTime}
                    disabled={disabled}
                    onChange={(value) => updateLine(index, 'chargeTime', value)}
                  />
                  <NumberInput
                    label="NC time (h)"
                    value={line.ncTime}
                    disabled={disabled}
                    onChange={(value) => updateLine(index, 'ncTime', value)}
                  />
                </SimpleGrid>
              </Stack>
            </Card>
          );
        })}

        {disabled ? null : (
          <Button variant="light" onClick={addLine}>
            Add activity line
          </Button>
        )}
      </Stack>
    </Fieldset>
  );
};
