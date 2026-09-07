import { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  Button,
  Card,
  Center,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Table,
  Text
} from '@mantine/core';
import { getBonusConfig, updateBonusConfig } from '../../services/bonusConfigService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const RATE_TYPE_OPTIONS = [
  { value: 'perMeter', label: 'Rate per meter' },
  { value: 'flat', label: 'Flat amount' }
];

const blankBand = () => ({ fromMeters: 0, toMeters: 0, rateType: 'perMeter', value: 0 });

export const BonusConfigPanel = () => {
  const [threshold, setThreshold] = useState(85);
  const [tierTables, setTierTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const config = await getBonusConfig();
      setThreshold(config.recoveryThreshold);
      setTierTables(config.tierTables);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load the bonus configuration'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateBand = (employeeType, index, key, value) => {
    setTierTables((prev) =>
      prev.map((tier) =>
        tier.employeeType === employeeType
          ? {
              ...tier,
              bands: tier.bands.map((band, i) => (i === index ? { ...band, [key]: value } : band))
            }
          : tier
      )
    );
  };

  const addBand = (employeeType) => {
    setTierTables((prev) =>
      prev.map((tier) =>
        tier.employeeType === employeeType
          ? { ...tier, bands: [...tier.bands, blankBand()] }
          : tier
      )
    );
  };

  const removeBand = (employeeType, index) => {
    setTierTables((prev) =>
      prev.map((tier) =>
        tier.employeeType === employeeType
          ? { ...tier, bands: tier.bands.filter((_, i) => i !== index) }
          : tier
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const config = await updateBonusConfig({
        recoveryThreshold: Number(threshold) || 0,
        tierTables: tierTables.map((tier) => ({
          employeeType: tier.employeeType,
          bands: tier.bands.map((band) => ({
            fromMeters: Number(band.fromMeters) || 0,
            toMeters: Number(band.toMeters) || 0,
            rateType: band.rateType,
            value: Number(band.value) || 0
          }))
        }))
      });
      setThreshold(config.recoveryThreshold);
      setTierTables(config.tierTables);
      notifySuccess('Bonus configuration saved');
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to save the bonus configuration'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Card withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Recovery threshold</Text>
          <Text size="sm" c="dimmed">
            A shift counts toward the monthly bonus only when its recovery percentage is at or above
            this value.
          </Text>
          <NumberInput
            label="Recovery threshold %"
            value={threshold}
            min={0}
            max={100}
            onChange={setThreshold}
            w={200}
          />
        </Stack>
      </Card>

      <Card withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={600}>Tier tables by employee type</Text>
          <Text size="sm" c="dimmed">
            The whole month&apos;s recovery-eligible meters are looked up against one band. A flat
            band pays its amount once; a per-meter band pays the rate times the total eligible
            meters.
          </Text>
          <Accordion variant="separated" multiple>
            {tierTables.map((tier) => (
              <Accordion.Item key={tier.employeeType} value={tier.employeeType}>
                <Accordion.Control>
                  {tier.employeeType}
                  <Text component="span" c="dimmed" size="sm">
                    {'  '}
                    ({tier.bands.length} {tier.bands.length === 1 ? 'band' : 'bands'})
                  </Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    {tier.bands.length === 0 ? (
                      <Text c="dimmed" size="sm">
                        No bands configured. Users of this type show no bonus amount.
                      </Text>
                    ) : (
                      <Table.ScrollContainer minWidth={520}>
                        <Table verticalSpacing="xs">
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>From (m)</Table.Th>
                              <Table.Th>To (m)</Table.Th>
                              <Table.Th>Type</Table.Th>
                              <Table.Th>Rate / amount</Table.Th>
                              <Table.Th />
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {tier.bands.map((band, index) => (
                              <Table.Tr key={index}>
                                <Table.Td>
                                  <NumberInput
                                    value={band.fromMeters}
                                    min={0}
                                    onChange={(value) =>
                                      updateBand(tier.employeeType, index, 'fromMeters', value)
                                    }
                                    w={110}
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <NumberInput
                                    value={band.toMeters}
                                    min={0}
                                    onChange={(value) =>
                                      updateBand(tier.employeeType, index, 'toMeters', value)
                                    }
                                    w={110}
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <Select
                                    data={RATE_TYPE_OPTIONS}
                                    value={band.rateType}
                                    onChange={(value) =>
                                      updateBand(
                                        tier.employeeType,
                                        index,
                                        'rateType',
                                        value || 'perMeter'
                                      )
                                    }
                                    allowDeselect={false}
                                    w={150}
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <NumberInput
                                    value={band.value}
                                    min={0}
                                    decimalScale={2}
                                    onChange={(value) =>
                                      updateBand(tier.employeeType, index, 'value', value)
                                    }
                                    w={120}
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <Button
                                    size="compact-sm"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => removeBand(tier.employeeType, index)}
                                  >
                                    Remove
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Table.ScrollContainer>
                    )}
                    <Group>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => addBand(tier.employeeType)}
                      >
                        Add band
                      </Button>
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      </Card>

      <Group justify="flex-end">
        <Button loading={saving} onClick={handleSave}>
          Save configuration
        </Button>
      </Group>
    </Stack>
  );
};
