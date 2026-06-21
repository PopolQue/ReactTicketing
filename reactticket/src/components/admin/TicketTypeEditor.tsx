import React from 'react';
import { useTicketTypeEditor } from '../../hooks/useTicketTypeEditor';
import { TicketTypeRow } from './TicketTypeRow';
import { TicketTypeForm } from './TicketTypeForm';

export const TicketTypeEditor: React.FC = () => {
  const {
    ticketTypes,
    newType,
    setNewType,
    editingId,
    editValues,
    setEditValues,
    editTimes,
    setEditTimes,
    showArchived,
    setShowArchived,
    toggleArchive,
    startEdit,
    saveTicketType,
    addTicketType,
    formatDateTimeForTimezone,
  } = useTicketTypeEditor();

  return (
    <section style={{ marginTop: '20px' }} role="region" aria-label="Ticket Type Editor">
      <h3>Ticket Types Configuration</h3>
      <label>
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        Show Archived
      </label>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
            minWidth: '800px',
          }}
          aria-label="Ticket Types"
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Price</th>
              <th style={{ padding: '10px' }}>Valid From</th>
              <th style={{ padding: '10px' }}>Valid Until</th>
              <th style={{ padding: '10px' }}>Capacity</th>
              <th style={{ padding: '10px' }}>Visible</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ticketTypes
              .filter((t) => showArchived || !t.archived)
              .map((type) => (
                <TicketTypeRow
                  key={type.id}
                  type={type}
                  isEditing={editingId === type.id}
                  editValues={editValues}
                  setEditValues={setEditValues}
                  editTimes={editTimes}
                  setEditTimes={setEditTimes}
                  startEdit={startEdit}
                  saveTicketType={saveTicketType}
                  toggleArchive={toggleArchive}
                  formatDateTimeForTimezone={formatDateTimeForTimezone}
                />
              ))}
            <TicketTypeForm
              newType={newType}
              setNewType={setNewType}
              addTicketType={addTicketType}
            />
          </tbody>
        </table>
      </div>
    </section>
  );
};
