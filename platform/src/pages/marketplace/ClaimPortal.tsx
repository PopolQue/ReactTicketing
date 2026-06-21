import React from 'react';
import { useClaimsData } from '../../hooks/useClaimsData';
import type { EntityType } from '../../hooks/useClaimsData';
import ClaimsList from '../../components/marketplace/ClaimsList';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ClaimPortal() {
  const { t } = useLanguage();
  const {
    entityType,
    setEntityType,
    searchQuery,
    setSearchQuery,
    searchResults,
    submitting,
    proofUrl,
    setProofUrl,
    selectedEntity,
    setSelectedEntity,
    claimStatus,
    handleSearch,
    submitClaim,
    clearSearch,
    myClaims,
    markProofSubmitted,
  } = useClaimsData();

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
        {t('marketplace.claimPortal.title')}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1.1rem' }}>
        {t('marketplace.claimPortal.subtitle')}
      </p>

      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(52, 96, 64, 0.1)',
          border: '1px solid rgba(52, 96, 64, 0.3)',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: 'var(--accent)' }}>
            {t('marketplace.claimPortal.writerTitle')}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {t('marketplace.claimPortal.writerSubtitle')}
          </p>
        </div>
        <Link to="/apply/writer" className="btn-primary" style={{ textDecoration: 'none' }}>
          {t('marketplace.claimPortal.applyNow')}
        </Link>
      </div>

      {claimStatus && (
        <div
          className="glass-panel"
          style={{ padding: '16px', marginBottom: '24px', border: '1px solid var(--accent)' }}
        >
          {claimStatus}
        </div>
      )}

      {myClaims.length > 0 && (
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>
            {t('marketplace.claimPortal.myClaims')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {myClaims.map((claim) => (
              <div
                key={claim.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>
                    {claim.entity?.name || t('marketplace.claimPortal.unknown')}{' '}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ({claim.entity_type})
                    </span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {t('marketplace.claimPortal.status')}
                    <strong
                      style={{
                        color:
                          claim.status === 'approved'
                            ? '#10b981'
                            : claim.status === 'rejected'
                              ? '#ef4444'
                              : 'var(--accent)',
                      }}
                    >
                      {claim.status}
                    </strong>
                  </p>
                  {claim.status === 'rejected' && claim.rejection_reason && (
                    <p
                      style={{
                        margin: '8px 0 0 0',
                        fontSize: '0.9rem',
                        color: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        padding: '8px',
                        borderRadius: '4px',
                      }}
                    >
                      <strong>{t('marketplace.claimPortal.reason')}</strong>{' '}
                      {claim.rejection_reason}
                    </p>
                  )}
                </div>
                {claim.status === 'awaiting_proof' && (
                  <button
                    onClick={() => markProofSubmitted(claim.id)}
                    className="btn-primary"
                    style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                  >
                    I've added the proof
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedEntity ? (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {(['artists', 'organizers', 'venues'] as EntityType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setEntityType(type);
                  clearSearch();
                }}
                className={entityType === type ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, textTransform: 'capitalize' }}
              >
                {type}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="input-field"
              placeholder={`${t('marketplace.claimPortal.searchUnassigned')}${entityType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary">
              {t('marketplace.claimPortal.search')}
            </button>
          </form>

          <ClaimsList searchResults={searchResults} onSelectEntity={setSelectedEntity} />
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>
            {t('marketplace.claimPortal.verifyOwnership')}
            {selectedEntity.name}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {t('marketplace.claimPortal.verifyDesc')}
          </p>
          <form
            onSubmit={submitClaim}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div>
              <label
                style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}
              >
                {t('marketplace.claimPortal.verifyLabel')}
              </label>
              <input
                required
                type="url"
                className="input-field"
                placeholder="https://instagram.com/..."
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                {t('marketplace.claimPortal.back')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {submitting
                  ? t('marketplace.claimPortal.submitting')
                  : t('marketplace.claimPortal.submitClaim')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
