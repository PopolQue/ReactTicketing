import React from 'react';
import { PromoBatch } from 'reactticket-core/types/promo.types';

export interface PromoBatchListProps {
  batches: PromoBatch[];
  showArchived: boolean;
  setShowArchived: React.Dispatch<React.SetStateAction<boolean>>;
  expandedBatches: Set<string>;
  toggleBatch: (batchId: string) => void;
  exportCSV: (batch: PromoBatch) => void;
  toggleBatchActive: (batchId: string) => void;
  toggleBatchArchive: (batchId: string) => void;
  markAsSent: (batchId: string, code: string) => void;
  toggleCodeActive: (batchId: string, code: string) => void;
}

export const PromoBatchList: React.FC<PromoBatchListProps> = ({
  batches,
  showArchived,
  setShowArchived,
  expandedBatches,
  toggleBatch,
  exportCSV,
  toggleBatchActive,
  toggleBatchArchive,
  markAsSent,
  toggleCodeActive,
}) => {
  return (
    <section role="region" aria-label="Promo Code Batches">
      <label style={{ marginBottom: '10px', display: 'block' }}>
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        Show Archived
      </label>

      {batches
        .filter((b) => showArchived || !b.archived)
        .map((batch) => (
          <div
            key={batch.id}
            style={{
              marginBottom: '25px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              borderRadius: '12px',
              background: 'white',
              opacity: batch.archived ? 0.6 : 1,
            }}
          >
            <h4
              onClick={() => toggleBatch(batch.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleBatch(batch.id);
                }
              }}
              style={{
                margin: '0 0 15px 0',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              role="button"
              tabIndex={0}
              aria-expanded={expandedBatches.has(batch.id)}
              aria-label={`Promo batch: ${batch.name}`}
            >
              <span style={{ textDecoration: batch.archived ? 'line-through' : 'none' }}>
                {batch.name}
              </span>
              <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                  onClick={() => exportCSV(batch)}
                  aria-label={`Export CSV for ${batch.name}`}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                  onClick={() => toggleBatchActive(batch.id)}
                  aria-label={`${batch.codes.every((c) => !c.active) ? 'Reactivate' : 'Deprecate'} ${batch.name}`}
                >
                  {batch.codes.every((c) => !c.active) ? 'Reactivate' : 'Deprecate'}
                </button>
                <button
                  type="button"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                  onClick={() => toggleBatchArchive(batch.id)}
                  aria-label={`${batch.archived ? 'Unarchive' : 'Archive'} ${batch.name}`}
                >
                  {batch.archived ? 'Unarchive' : 'Archive'}
                </button>
                <small style={{ color: '#64748b' }}>
                  Expires: {new Date(batch.expiresAt).toLocaleDateString()}{' '}
                  {expandedBatches.has(batch.id) ? '▼' : '▶'}
                </small>
              </div>
            </h4>

            {expandedBatches.has(batch.id) && (
              <table
                style={{ width: '100%', borderCollapse: 'collapse' }}
                aria-label={`Promo codes for batch ${batch.name}`}
              >
                <thead>
                  <tr
                    style={{
                      textAlign: 'left',
                      borderBottom: '1px solid #e2e8f0',
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  >
                    <th style={{ padding: '8px' }}>Code</th>
                    <th style={{ padding: '8px' }}>Status</th>
                    <th style={{ padding: '8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.codes.map((code) => (
                    <tr key={code.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td
                        style={{
                          padding: '8px',
                          fontFamily: 'monospace',
                          textDecoration: !code.active ? 'line-through' : 'none',
                        }}
                      >
                        {code.code}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: code.sentAt ? '#dcfce7' : '#fee2e2',
                          }}
                        >
                          {code.sentAt ? 'Sent' : 'Not Sent'}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: code.usedCount > 0 ? '#dcfce7' : '#f1f5f9',
                            marginLeft: '5px',
                          }}
                        >
                          {code.usedCount > 0 ? 'Used' : 'Unused'}
                        </span>
                        {!code.active && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#e2e8f0',
                              marginLeft: '5px',
                            }}
                          >
                            Deprecated
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px' }}>
                        {!code.sentAt && (
                          <button
                            type="button"
                            style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                            onClick={() => markAsSent(batch.id, code.code)}
                            aria-label={`Mark code ${code.code} as sent`}
                          >
                            Mark Sent
                          </button>
                        )}
                        <button
                          type="button"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            marginLeft: '5px',
                          }}
                          onClick={() => toggleCodeActive(batch.id, code.code)}
                          aria-label={`${code.active ? 'Deprecate' : 'Activate'} code ${code.code}`}
                        >
                          {code.active ? 'Deprecate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
    </section>
  );
};
