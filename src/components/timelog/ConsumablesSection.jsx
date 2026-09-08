import { Autocomplete, Button, Card, Group, NumberInput, Stack, Text } from '@mantine/core';
import { CONSUMABLE_ITEMS } from '../../constants/consumables.js';

const blankConsumable = {
  itemName: '',
  qtyTaken: '',
  qtyReturned: '',
  qtyUsed: ''
};

const FALLBACK_OPTIONS = [{ group: 'Common', items: CONSUMABLE_ITEMS }];

export const ConsumablesSection = ({ items, onChange, disabled, groupedOptions }) => {
  const options = groupedOptions?.length ? groupedOptions : FALLBACK_OPTIONS;
  const updateItem = (index, key, value) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => onChange([...items, { ...blankConsumable }]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <Stack gap="md">
      {items.length === 0 ? (
        <Text c="dimmed" size="sm">
          No consumables added yet.
        </Text>
      ) : null}

        {items.map((item, index) => (
          <Card key={index} withBorder radius="sm" p="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600} size="sm">
                  Item {index + 1}
                </Text>
                {disabled ? null : (
                  <Button variant="subtle" color="red" size="compact-sm" onClick={() => removeItem(index)}>
                    Remove
                  </Button>
                )}
              </Group>
              <Autocomplete
                label="Item"
                placeholder="Search or type an item"
                data={options}
                value={item.itemName}
                disabled={disabled}
                limit={30}
                onChange={(value) => updateItem(index, 'itemName', value)}
              />
              <NumberInput
                label="Qty taken"
                value={item.qtyTaken}
                disabled={disabled}
                onChange={(value) => updateItem(index, 'qtyTaken', value)}
              />
              <NumberInput
                label="Qty returned"
                value={item.qtyReturned}
                disabled={disabled}
                onChange={(value) => updateItem(index, 'qtyReturned', value)}
              />
              <NumberInput
                label="Qty used"
                value={item.qtyUsed}
                disabled={disabled}
                onChange={(value) => updateItem(index, 'qtyUsed', value)}
              />
            </Stack>
          </Card>
        ))}

      {disabled ? null : (
        <Button variant="light" onClick={addItem}>
          Add consumable
        </Button>
      )}
    </Stack>
  );
};
