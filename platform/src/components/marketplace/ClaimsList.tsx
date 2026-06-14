interface ClaimsListProps {
  searchResults: any[];
  onSelectEntity: (entity: any) => void;
}

export default function ClaimsList({ searchResults, onSelectEntity }: ClaimsListProps) {
  if (searchResults.length === 0) return null;

  return (
    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {searchResults.map(entity => (
        <div key={entity.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {entity.image_url ? (
              <img src={entity.image_url} alt={entity.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            )}
            <div>
              <span style={{ fontWeight: 600, fontSize: '1.1rem', display: 'block' }}>{entity.name}</span>
              {entity.city && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{entity.city}</span>}
            </div>
          </div>
          <button onClick={() => onSelectEntity(entity)} className="btn-secondary">Claim This Profile</button>
        </div>
      ))}
    </div>
  );
}
