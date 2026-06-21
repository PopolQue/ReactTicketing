import React from 'react';
import { TicketTypeConfig } from 'reactticket-core/types/ticket.types';
import { formatCurrency } from 'reactticket-core/utils/formatCurrency';
import { PricingInput } from './PricingInput';

export interface TicketTypeRowProps {
  type: TicketTypeConfig;
  isEditing: boolean;
  editValues: Partial<TicketTypeConfig>;
  setEditValues: React.Dispatch<React.SetStateAction<Partial<TicketTypeConfig>>>;
  editTimes: {
    validFromDate: string;
    validFromTime: string;
    validUntilDate: string;
    validUntilTime: string;
  };
  setEditTimes: React.Dispatch<
    React.SetStateAction<{
      validFromDate: string;
      validFromTime: string;
      validUntilDate: string;
      validUntilTime: string;
    }>
  >;
  startEdit: (type: TicketTypeConfig) => void;
  saveTicketType: (type: TicketTypeConfig) => void;
  toggleArchive: (type: TicketTypeConfig) => void;
  formatDateTimeForTimezone: (date?: Date | string) => string;
}

const getPrice = (pricing: any) => {
  return pricing?.priceInCents ?? 0;
};

export const TicketTypeRow: React.FC<TicketTypeRowProps> = ({
  type,
  isEditing,
  editValues,
  setEditValues,
  editTimes,
  setEditTimes,
  startEdit,
  saveTicketType,
  toggleArchive,
  formatDateTimeForTimezone,
}) => {
  return (
    <tr
      style={{
        borderBottom: '1px solid #e2e8f0',
        textDecoration: type.archived ? 'line-through' : 'none',
        opacity: type.archived ? 0.6 : 1,
      }}
    >
      <td style={{ padding: '10px' }}>
        {isEditing ? (
          <input
            style={{ width: '100%' }}
            value={editValues.name ?? type.name}
            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
            aria-label={`Edit name for ${type.name}`}
          />
        ) : (
          type.name
        )}
      </td>
      <td style={{ padding: '10px' }}>
        {isEditing ? (
          <PricingInput
            valueCents={getPrice(editValues.pricing)}
            onChangeCents={(cents) =>
              setEditValues({
                ...editValues,
                pricing: {
                  kind: 'paid',
                  priceInCents: cents,
                  currency:
                    (editValues.pricing as any)?.currency ||
                    (type.pricing as any)?.currency ||
                    'USD',
                },
              })
            }
            currency={
              (editValues.pricing as any)?.currency || (type.pricing as any)?.currency || 'USD'
            }
            onCurrencyChange={(curr) =>
              setEditValues({
                ...editValues,
                pricing: {
                  kind: 'paid',
                  priceInCents: getPrice(editValues.pricing),
                  currency: curr,
                },
              })
            }
          />
        ) : type.pricing.kind === 'paid' ? (
          formatCurrency(type.pricing.priceInCents, type.pricing.currency)
        ) : (
          'Free'
        )}
      </td>
      <td style={{ padding: '10px' }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
            <input
              type="date"
              value={editTimes.validFromDate}
              onChange={(e) => setEditTimes({ ...editTimes, validFromDate: e.target.value })}
              aria-label={`Edit valid from date for ${type.name}`}
            />
            <input
              type="time"
              value={editTimes.validFromTime}
              onChange={(e) => setEditTimes({ ...editTimes, validFromTime: e.target.value })}
              aria-label={`Edit valid from time for ${type.name}`}
            />
          </div>
        ) : (
          formatDateTimeForTimezone(type.validFrom)
        )}
      </td>
      <td style={{ padding: '10px' }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
            <input
              type="date"
              value={editTimes.validUntilDate}
              onChange={(e) => setEditTimes({ ...editTimes, validUntilDate: e.target.value })}
              aria-label={`Edit valid until date for ${type.name}`}
            />
            <input
              type="time"
              value={editTimes.validUntilTime}
              onChange={(e) => setEditTimes({ ...editTimes, validUntilTime: e.target.value })}
              aria-label={`Edit valid until time for ${type.name}`}
            />
          </div>
        ) : (
          formatDateTimeForTimezone(type.validUntil)
        )}
      </td>
      <td style={{ padding: '10px' }}>
        {isEditing ? (
          <input
            style={{ width: '100%' }}
            type="number"
            value={editValues.capacity ?? type.capacity}
            onChange={(e) => setEditValues({ ...editValues, capacity: parseInt(e.target.value) })}
            aria-label={`Edit capacity for ${type.name}`}
          />
        ) : (
          type.capacity
        )}
      </td>
      <td style={{ padding: '10px' }}>
        {isEditing ? (
          <input
            type="checkbox"
            checked={editValues.visible ?? type.visible}
            onChange={(e) => setEditValues({ ...editValues, visible: e.target.checked })}
            aria-label={`Edit visible status for ${type.name}`}
          />
        ) : type.visible ? (
          'Visible'
        ) : (
          'Hidden'
        )}
      </td>
      <td style={{ padding: '10px' }}>
        {isEditing ? (
          <button
            type="button"
            onClick={() => saveTicketType(type)}
            aria-label={`Save changes for ${type.name}`}
          >
            Save
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              type="button"
              onClick={() => startEdit(type)}
              aria-label={`Edit ticket type ${type.name}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => toggleArchive(type)}
              aria-label={`${type.archived ? 'Unarchive' : 'Archive'} ticket type ${type.name}`}
            >
              {type.archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
