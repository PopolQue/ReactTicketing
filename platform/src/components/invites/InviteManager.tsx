import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState } from 'react';
import { useInviteManager } from '../../hooks/useInviteManager';
interface InviteManagerProps {
  scope: "all" | "artist";
  organizerId?: string;
}
export function InviteManager({
  scope,
  organizerId
}: InviteManagerProps) {
  const {
    t
  } = useLanguage();
  const {
    invites,
    isLoading,
    create,
    revoke
  } = useInviteManager(scope, organizerId);
  const [showCreate, setShowCreate] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);

  // Form State
  const [entityType, setEntityType] = useState<'organizer' | 'artist' | 'venue'>('artist');
  const [entityId, setEntityId] = useState('');
  const [entityName, setEntityName] = useState('');
  const [role, setRole] = useState('artist_member');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await create({
        entityType,
        entityId,
        entityName,
        role,
        inviteeEmail
      });
      setNewInviteUrl(res.rawUrl);
      setShowCreate(false);
    } catch (err: any) {
      alert("Error creating invite: " + err.message);
    }
  };
  return <div style={{
    padding: '24px',
    backgroundColor: 'var(--panel-bg)',
    borderRadius: '12px',
    border: '1px solid var(--border)'
  }}>
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    }}>
        <h2 style={{
        margin: 0
      }}>{t("inviteLinks")}</h2>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Create Invite'}
        </button>
      </div>

      {newInviteUrl && <div style={{
      padding: '24px',
      backgroundColor: 'rgba(52, 96, 64, 0.1)',
      border: '1px solid var(--accent)',
      borderRadius: '8px',
      marginBottom: '24px',
      textAlign: 'center'
    }}>
          <h3 style={{
        color: 'var(--accent)',
        marginTop: 0
      }}>{t("inviteCreatedSuccessfully")}</h3>
          <p style={{
        color: 'var(--text-secondary)'
      }}>{t("copyThisLinkNowItCannot")}</p>
          
          <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        margin: '24px 0',
        padding: '16px',
        backgroundColor: '#000',
        borderRadius: '8px',
        fontFamily: 'monospace',
        wordBreak: 'break-all'
      }}>
            {newInviteUrl}
            <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(newInviteUrl)} style={{
          padding: '8px 16px',
          whiteSpace: 'nowrap'
        }}>{t("copy")}</button>
          </div>



          <button className="btn-secondary" style={{
        marginTop: '24px'
      }} onClick={() => setNewInviteUrl(null)}>{t("done")}</button>
        </div>}

      {showCreate && !newInviteUrl && <form onSubmit={handleCreate} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '32px',
      padding: '24px',
      border: '1px solid var(--border)',
      borderRadius: '8px'
    }}>
          <h3>{t("generateNewInvite")}</h3>
          
          {scope === 'all' && <select className="input-field" value={entityType} onChange={e => setEntityType(e.target.value as any)}>
              <option value="organizer">{t("organizerSingular")}</option>
              <option value="artist">{t("artist")}</option>
              <option value="venue">{t("venue")}</option>
            </select>}

          <input required type="text" placeholder={t("entityIdUuid")} className="input-field" value={entityId} onChange={e => setEntityId(e.target.value)} />
          <input required type="text" placeholder={t("entityNameEGBerghain")} className="input-field" value={entityName} onChange={e => setEntityName(e.target.value)} />
          <input type="email" placeholder={t("inviteeEmailOptional")} className="input-field" value={inviteeEmail} onChange={e => setInviteeEmail(e.target.value)} />
          
          <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
            <option value="organizer">{t("organizerAdmin")}</option>
            <option value="artist_member">{t("artistMember")}</option>
            <option value="venue_manager">{t("venueManager")}</option>
          </select>

          <button type="submit" className="btn-primary" style={{
        marginTop: '16px'
      }}>{t("generateSecureLink")}</button>
        </form>}

      {isLoading ? <p>{t("loadingInvites")}</p> : <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left'
    }}>
          <thead>
            <tr style={{
          borderBottom: '1px solid var(--border)',
          color: 'var(--text-secondary)'
        }}>
              <th style={{
            padding: '12px'
          }}>{t("entity")}</th>
              <th style={{
            padding: '12px'
          }}>{t("role")}</th>
              <th style={{
            padding: '12px'
          }}>{t("emailHint")}</th>
              <th style={{
            padding: '12px'
          }}>{t("status1")}</th>
              <th style={{
            padding: '12px'
          }}>{t("created")}</th>
              <th style={{
            padding: '12px'
          }}>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {invites.map(invite => {

          return <tr key={invite.id} style={{
            borderBottom: '1px solid var(--border)'
          }}>
                <td style={{
              padding: '12px'
            }}>
                  <strong>{invite.entity_name}</strong>
                  <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>{invite.entity_type}</div>
                </td>
                <td style={{
              padding: '12px'
            }}>{invite.role}</td>
                <td style={{
              padding: '12px'
            }}>{invite.invitee_email || '—'}</td>
                <td style={{
              padding: '12px'
            }}>
                  <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                backgroundColor: invite.status === 'pending' ? 'rgba(59, 130, 246, 0.2)' : invite.status === 'accepted' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: invite.status === 'pending' ? '#60a5fa' : invite.status === 'accepted' ? '#4ade80' : '#f87171'
              }}>
                    {invite.status.toUpperCase()}
                  </span>
                </td>
                <td style={{
              padding: '12px',
              fontSize: '0.9rem'
            }}>{new Date(invite.created_at).toLocaleDateString()}</td>
                <td style={{
              padding: '12px'
            }}>
                  {invite.status === 'pending' && <button className="btn-secondary" style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                color: '#f87171',
                borderColor: '#f87171'
              }} onClick={() => {
                if (confirm('Revoke this invite permanently?')) revoke(invite.id);
              }}>{t("revoke")}</button>}
                </td>
              </tr>;
        })}
            {invites.length === 0 && <tr>
                <td colSpan={6} style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>{t("noInvitesFound")}</td>
              </tr>}
          </tbody>
        </table>}
    </div>;
}