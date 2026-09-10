import { Badge, Box, Group, Paper, SimpleGrid, Stack, Table, Text } from '@mantine/core';
import { TIME_LOG_STATUS_COLORS } from '../../constants/timeLogs.js';
import { formatDate } from '../../lib/dateRange.js';

const show = (value, suffix = '') =>
  value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;

const yesNo = (value) => (value ? 'Yes' : 'No');

const Field = ({ label, value }) => (
  <Box>
    <Text size="xs" c="dimmed">
      {label}
    </Text>
    <Text fw={500}>{value}</Text>
  </Box>
);

const Section = ({ title, children }) => (
  <Paper withBorder radius="lg" p="lg">
    <Stack gap="md">
      <Text fw={700}>{title}</Text>
      {children}
    </Stack>
  </Paper>
);

const StatTile = ({ label, value }) => (
  <Paper radius="md" p="sm" bg="var(--mantine-color-brand-0)">
    <Text fw={700} fz="lg" lh={1.2}>
      {value}
    </Text>
    <Text size="xs" c="dimmed" mt={2}>
      {label}
    </Text>
  </Paper>
);

export const TimeLogEntryView = ({ entry }) => {
  const job = entry.jobId || {};
  const lines = entry.activityLines || [];
  const consumables = entry.consumables || [];
  const crew = entry.crew || [];
  const fuel = entry.fuel || {};
  const wellTag = entry.wellTag || {};
  const hasMileage =
    entry.mileageStart !== null && entry.mileageStart !== undefined
      ? true
      : entry.mileageEnd !== null && entry.mileageEnd !== undefined;

  return (
    <Stack gap="lg">
      <Paper withBorder radius="lg" p="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Text fw={700} fz="lg">
              Job {job.jobNumber || '—'} · {job.clientName || '—'}
            </Text>
            <Text size="sm" c="dimmed">
              {job.jobLocation || 'No location'}
              {job.rigNumber?.name ? ` · Rig ${job.rigNumber.name}` : ''} ·{' '}
              {entry.userId?.name || 'Manager'} · {formatDate(entry.date)}
            </Text>
          </Stack>
          <Stack gap={4} align="flex-end">
            <Badge variant="light" color={TIME_LOG_STATUS_COLORS[entry.status]} size="lg">
              {entry.status}
            </Badge>
            {entry.status === 'submitted' ? (
              <Text size="xs" c="dimmed">
                Submitted {formatDate(entry.updatedAt)}
              </Text>
            ) : null}
          </Stack>
        </Group>
      </Paper>

      <Section title="Shift & Time">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <Field label="Date" value={formatDate(entry.date)} />
          <Field label="Shift" value={show(entry.shift)} />
          <Field label="Time in" value={show(entry.timeIn)} />
          <Field label="Time out" value={show(entry.timeOut)} />
          <Field label="Time started" value={show(entry.timeStarted)} />
          <Field label="Time finished" value={show(entry.timeFinished)} />
          <Field label="Hours on site" value={show(entry.hoursOnSite)} />
          <Field label="Standby hours" value={show(entry.standbyHours)} />
          <Field label="Other hours" value={show(entry.otherHours)} />
        </SimpleGrid>
      </Section>

      <Section title="Crew">
        {crew.length ? (
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Time in</Table.Th>
                <Table.Th>Time out</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {crew.map((member, index) => (
                <Table.Tr key={member.employeeId?.id || member.employeeId?._id || index}>
                  <Table.Td>{member.employeeId?.name || '—'}</Table.Td>
                  <Table.Td>{member.employeeId?.employeeType || '—'}</Table.Td>
                  <Table.Td>{show(member.timeIn)}</Table.Td>
                  <Table.Td>{show(member.timeOut)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" size="sm">
            No crew recorded.
          </Text>
        )}
      </Section>

      <Section title="Well Tag & shift totals">
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
          <Field label="Installed" value={yesNo(wellTag.installed)} />
          <Field label="Decommissioned" value={yesNo(wellTag.decommissioned)} />
          <Field label="Locates provided by" value={show(wellTag.locatesProvidedBy)} />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          <StatTile label="Total Drilled" value={show(entry.metersDrilled, ' m')} />
          <StatTile label="Total Recovered" value={show(entry.metersRecovered, ' m')} />
          <StatTile label="Activity hours" value={show(entry.totalHours, ' h')} />
          <StatTile
            label="Recovery %"
            value={entry.recoveryPercent === null ? '—' : `${entry.recoveryPercent}%`}
          />
        </SimpleGrid>
      </Section>

      <Section title="Activity Lines">
        {lines.length ? (
          <Table.ScrollContainer minWidth={860}>
            <Table verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Activity</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Depth from</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Depth to</Table.Th>
                  <Table.Th>Time from</Table.Th>
                  <Table.Th>Time to</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Recovery</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Drilled</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Hours</Table.Th>
                  <Table.Th>Comments</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lines.map((line, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>
                      {line.activityId?.name ? (
                        <>
                          {line.activityId.name}
                          {line.activityId.categoryId?.name ? (
                            <Text size="xs" c="dimmed">
                              {line.activityId.categoryId.name}
                            </Text>
                          ) : null}
                        </>
                      ) : (
                        show(line.description)
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{show(line.depthFrom)}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{show(line.depthTo)}</Table.Td>
                    <Table.Td>{show(line.timeFrom)}</Table.Td>
                    <Table.Td>{show(line.timeTo)}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{show(line.recoveryMeters)}</Table.Td>
                    <Table.Td
                      style={{ textAlign: 'right', backgroundColor: 'var(--mantine-color-brand-0)' }}
                    >
                      {show(line.drilledMeters, ' m')}
                    </Table.Td>
                    <Table.Td
                      style={{ textAlign: 'right', backgroundColor: 'var(--mantine-color-brand-0)' }}
                    >
                      {show(line.hours, ' h')}
                    </Table.Td>
                    <Table.Td>{show(line.comments)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Text c="dimmed" size="sm">
            No activity lines recorded.
          </Text>
        )}
      </Section>

      <Section title="Fuel">
        <SimpleGrid cols={{ base: 3 }} spacing="md">
          <Field label="Dyed (L)" value={show(fuel.dyedLt)} />
          <Field label="Diesel (L)" value={show(fuel.dieselLt)} />
          <Field label="Gasoline (L)" value={show(fuel.gasolineLt)} />
        </SimpleGrid>
      </Section>

      <Section title="Consumables">
        {consumables.length ? (
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Taken</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Returned</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Used</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {consumables.map((item, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{show(item.itemName)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{show(item.qtyTaken)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{show(item.qtyReturned)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{show(item.qtyUsed)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" size="sm">
            No consumables recorded.
          </Text>
        )}
      </Section>

      {hasMileage ? (
        <Section title="Mileage">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Field label="Mileage start" value={show(entry.mileageStart)} />
            <Field label="Mileage end" value={show(entry.mileageEnd)} />
            <Field label="Mileage total" value={show(entry.mileageTotal)} />
          </SimpleGrid>
        </Section>
      ) : null}
    </Stack>
  );
};
