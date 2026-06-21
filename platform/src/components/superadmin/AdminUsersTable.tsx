import { useLanguage } from '../../contexts/LanguageContext';
interface AdminUsersTableProps {
  admins: any[];
  onRemoveRole: (id: string, role: string) => void;
}
export default function AdminUsersTable({ admins, onRemoveRole }: AdminUsersTableProps) {
  const { t } = useLanguage();
  return (
    <div
      className="glass-panel"
      style={{
        padding: '0',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}
          >
            <th
              style={{
                padding: '16px 24px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {t('userId')}
            </th>
            <th
              style={{
                padding: '16px 24px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {t('role')}
            </th>
            <th
              style={{
                padding: '16px 24px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {t('eventsReviewed')}
            </th>
            <th
              style={{
                padding: '16px 24px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {t('ticketsResolved')}
            </th>
            <th
              style={{
                padding: '16px 24px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => {
            return (
              <tr
                key={admin.id}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <td
                  style={{
                    padding: '16px 24px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                  }}
                >
                  {admin.user_id}
                </td>
                <td
                  style={{
                    padding: '16px 24px',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: admin.role === 'superadmin' ? '#c084fc' : '#6366f1',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      color: 'white',
                    }}
                  >
                    {admin.role.toUpperCase()}
                  </span>
                </td>
                <td
                  style={{
                    padding: '16px 24px',
                    fontWeight: 600,
                  }}
                >
                  {admin.eventsReviewed}
                </td>
                <td
                  style={{
                    padding: '16px 24px',
                    fontWeight: 600,
                  }}
                >
                  {admin.ticketsResolved}
                </td>
                <td
                  style={{
                    padding: '16px 24px',
                  }}
                >
                  {admin.role !== 'superadmin' && (
                    <button
                      onClick={() => onRemoveRole(admin.id, admin.role)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('revoke')}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {admins.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                {t('noRolesDefined')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
