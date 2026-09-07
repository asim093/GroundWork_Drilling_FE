import { Button, Card, Fieldset, Group, NumberInput, Stack, Text, TextInput, Textarea } from '@mantine/core';

const blankActivityLine = {
  boreholeRef: '',
  description: '',
  depth: '',
  timeFrom: '',
  timeTo: '',
  chargeTime: '',
  ncTime: ''
};

export const ActivityLinesSection = ({ lines, onChange, disabled }) => {
  const updateLine = (index, key, value) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
  };

  const addLine = () => onChange([...lines, { ...blankActivityLine }]);

  const removeLine = (index) => onChange(lines.filter((_, i) => i !== index));

  return (
    <Fieldset legend="Activity lines (BH#)">
      <Stack gap="md">
        {lines.length === 0 ? (
          <Text c="dimmed" size="sm">
            No activity lines added yet.
          </Text>
        ) : null}

        {lines.map((line, index) => (
          <Card key={index} withBorder radius="sm" p="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600} size="sm">
                  Line {index + 1}
                </Text>
                {disabled ? null : (
                  <Button variant="subtle" color="red" size="compact-sm" onClick={() => removeLine(index)}>
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
              <NumberInput
                label="Depth (m)"
                value={line.depth}
                disabled={disabled}
                onChange={(value) => updateLine(index, 'depth', value)}
              />
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
            </Stack>
          </Card>
        ))}

        {disabled ? null : (
          <Button variant="light" onClick={addLine}>
            Add activity line
          </Button>
        )}
      </Stack>
    </Fieldset>
  );
};
