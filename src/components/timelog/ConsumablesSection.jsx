import { ActionIcon, Autocomplete, Group, NumberInput, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { CONSUMABLE_ITEMS } from '../../constants/consumables.js';
import { BLANK_CONSUMABLE } from '../../constants/timeLogs.js';

const FALLBACK_OPTIONS = [{ group: 'Common', items: CONSUMABLE_ITEMS }];

export const ConsumablesSection = ({ items, onChange, disabled, groupedOptions, errors }) => {
  const options = groupedOptions?.length ? groupedOptions : FALLBACK_OPTIONS;

  const updateItem = (index, key, value) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => onChange([...items, { ...BLANK_CONSUMABLE }]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <Stack gap="sm">
      {items.length === 0 ? (
        <Text size="sm" c="dimmed">
          No consumables added yet.
        </Text>
      ) : null}

      {items.map((item, index) => {
        const itemError = errors?.[index];

        return (
          <Paper key={index} withBorder radius="md" p="sm">
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text fw={600} size="sm">
                  Item {index + 1}
                </Text>
                {disabled ? null : (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => removeItem(index)}
                  >
                    <NavIcon name="trash" size={15} />
                  </ActionIcon>
                )}
              </Group>

              <Autocomplete
                label="Item"
                size="sm"
                placeholder="Search or type an item"
                data={options}
                value={item.itemName}
                disabled={disabled}
                limit={30}
                error={itemError || undefined}
                onChange={(value) => updateItem(index, 'itemName', value)}
              />

              <SimpleGrid cols={{ base: 3 }} spacing="sm">
                <NumberInput
                  label="Qty taken"
                  size="sm"
                  hideControls
                  min={0}
                  placeholder="0"
                  value={item.qtyTaken}
                  disabled={disabled}
                  onChange={(value) => updateItem(index, 'qtyTaken', value)}
                />
                <NumberInput
                  label="Qty returned"
                  size="sm"
                  hideControls
                  min={0}
                  placeholder="0"
                  value={item.qtyReturned}
                  disabled={disabled}
                  onChange={(value) => updateItem(index, 'qtyReturned', value)}
                />
                <NumberInput
                  label="Qty used"
                  size="sm"
                  hideControls
                  min={0}
                  placeholder="0"
                  value={item.qtyUsed}
                  disabled={disabled}
                  fw={700}
                  styles={{
                    input: {
                      backgroundColor: 'var(--mantine-color-brand-0)',
                      color: 'var(--mantine-color-brand-9)',
                      fontWeight: 700
                    }
                  }}
                  onChange={(value) => updateItem(index, 'qtyUsed', value)}
                />
              </SimpleGrid>
            </Stack>
          </Paper>
        );
      })}

      {disabled ? null : (
        <button type="button" className="tl-add-line" onClick={addItem}>
          + Add consumable
        </button>
      )}
    </Stack>
  );
};
