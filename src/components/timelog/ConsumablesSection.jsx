import { ActionIcon, Autocomplete, NumberInput } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { CONSUMABLE_ITEMS } from '../../constants/consumables.js';
import { BLANK_CONSUMABLE } from '../../constants/timeLogs.js';

const FALLBACK_OPTIONS = [{ group: 'Common', items: CONSUMABLE_ITEMS }];

export const ConsumablesSection = ({ items, onChange, disabled, groupedOptions }) => {
  const options = groupedOptions?.length ? groupedOptions : FALLBACK_OPTIONS;

  const updateItem = (index, key, value) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => onChange([...items, { ...BLANK_CONSUMABLE }]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  const qtyCell = (index, key, label) => (
    <NumberInput
      variant="unstyled"
      size="sm"
      hideControls
      min={0}
      placeholder="0"
      value={items[index][key]}
      disabled={disabled}
      aria-label={label}
      onChange={(value) => updateItem(index, key, value)}
    />
  );

  return (
    <div className="tlgrid-wrap">
      <table className="tlgrid tlgrid-consumables">
        <colgroup>
          <col style={{ width: 44 }} />
          <col style={{ minWidth: 240 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 44 }} />
        </colgroup>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th className="tlnum">Qty taken</th>
            <th className="tlnum">Qty returned</th>
            <th className="tlnum">Qty used</th>
            <th aria-label="Remove" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="tlgrid-empty">
                No consumables added yet.
              </td>
            </tr>
          ) : null}

          {items.map((item, index) => (
            <tr key={index}>
              <td className="tlidx">{index + 1}</td>
              <td>
                <Autocomplete
                  variant="unstyled"
                  size="sm"
                  placeholder="Search or type an item"
                  data={options}
                  value={item.itemName}
                  disabled={disabled}
                  limit={30}
                  aria-label={`Item ${index + 1}`}
                  comboboxProps={{ width: 320, position: 'bottom-start' }}
                  onChange={(value) => updateItem(index, 'itemName', value)}
                />
              </td>
              <td className="tlnum">{qtyCell(index, 'qtyTaken', `Item ${index + 1} qty taken`)}</td>
              <td className="tlnum">
                {qtyCell(index, 'qtyReturned', `Item ${index + 1} qty returned`)}
              </td>
              <td className="tlnum">{qtyCell(index, 'qtyUsed', `Item ${index + 1} qty used`)}</td>
              <td className="tldelcell">
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
              </td>
            </tr>
          ))}

          {disabled ? null : (
            <tr className="tlgrid-add">
              <td colSpan={6}>
                <button type="button" onClick={addItem}>
                  + Add consumable
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
