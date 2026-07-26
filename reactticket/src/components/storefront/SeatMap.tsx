import React from 'react';

export interface Seat {
  id: string;
  row: string;
  number: number;
  section: string;
  priceCents: number;
  status: 'available' | 'reserved' | 'selected';
}

interface Props {
  seats: Seat[];
  selectedSeatIds: string[];
  onSeatToggle: (seatId: string) => void;
  accentColor?: string;
}

export const SeatMap: React.FC<Props> = ({
  seats,
  selectedSeatIds,
  onSeatToggle,
  accentColor = '#0284c7',
}) => {
  // Group seats by section and row
  const sections = Array.from(new Set(seats.map((s) => s.section)));

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      {/* Stage / Focal Banner */}
      <div
        style={{
          width: '80%',
          padding: '8px',
          background: '#e2e8f0',
          borderRadius: '24px',
          textAlign: 'center',
          fontWeight: 600,
          color: '#475569',
          fontSize: '0.85rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        STAGE / FRONT OF VENUE
      </div>

      {/* Seat Map Visual Container */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          overflowX: 'auto',
        }}
      >
        {sections.map((section) => {
          const sectionSeats = seats.filter((s) => s.section === section);
          const rows = Array.from(new Set(sectionSeats.map((s) => s.row)));

          return (
            <div key={section} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Section: {section}
              </div>

              {rows.map((row) => {
                const rowSeats = sectionSeats
                  .filter((s) => s.row === row)
                  .sort((a, b) => a.number - b.number);

                return (
                  <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', width: '20px' }}>
                      {row}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {rowSeats.map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        const isReserved = seat.status === 'reserved';

                        let bg = '#e2e8f0';
                        if (isReserved) bg = '#cbd5e1';
                        else if (isSelected) bg = accentColor;
                        else bg = '#22c55e';

                        return (
                          <button
                            key={seat.id}
                            disabled={isReserved}
                            onClick={() => onSeatToggle(seat.id)}
                            title={`Row ${seat.row}, Seat ${seat.number} (${seat.section}) - $${(seat.priceCents / 100).toFixed(2)}`}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px 8px 4px 4px',
                              border: isSelected ? `2px solid ${accentColor}` : 'none',
                              backgroundColor: bg,
                              color: isSelected ? 'white' : '#1e293b',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: isReserved ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'transform 0.15s, background-color 0.15s',
                              opacity: isReserved ? 0.4 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isReserved) e.currentTarget.style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isReserved) e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {seat.number}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: '#475569', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#22c55e' }} />
          Available
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: accentColor }} />
          Selected
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#cbd5e1', opacity: 0.4 }} />
          Occupied / Reserved
        </div>
      </div>
    </div>
  );
};
