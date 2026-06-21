import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EntitySwitcher, { type Entity } from '../../components/EntitySwitcher';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ArtistLayout() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeEntity, setActiveEntity] = useState<Entity | null>(null);
  const [claim, setClaim] = useState<any>(null);

  useEffect(() => {
    async function fetchClaim() {
      if (activeEntity?.type === 'artist') {
        const { data: artist } = await supabase
          .from('artists')
          .select('*')
          .eq('id', activeEntity.id)
          .single();

        const { data: claimRecord } = await supabase
          .from('entity_claims')
          .select('status')
          .eq('entity_id', activeEntity.id)
          .single();

        setClaim({
          artists: artist,
          status: claimRecord?.status,
          artist_id: activeEntity.id,
        });
      } else {
        setClaim(null);
      }
    }
    fetchClaim();
  }, [activeEntity]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleEntityChange = React.useCallback((entity: Entity | null) => {
    setActiveEntity(entity);
  }, []);

  const renderSidebarNav = () => {
    if (activeEntity?.type === 'fan') {
      return (
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button
            onClick={() => navigate('/discover')}
            className={`btn-nav ${location.pathname === '/discover' ? 'active' : ''}`}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {t('nav.discover')}
          </button>
          <button
            onClick={() => navigate('/friends')}
            className={`btn-nav ${location.pathname === '/friends' ? 'active' : ''}`}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {t('nav.friends')}
          </button>
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <button
            onClick={() => navigate('/profile')}
            className={`btn-nav ${location.pathname === '/profile' ? 'active' : ''}`}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {t('nav.profile')}
          </button>
          <button
            onClick={() => navigate('/wallet')}
            className={`btn-nav ${location.pathname === '/wallet' ? 'active' : ''}`}
            style={{
              padding: '12px',
              textAlign: 'left',
              borderRadius: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {t('nav.wallet')}
          </button>
        </nav>
      );
    }
    // Default Artist Portal Sidebar
    return (
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <button
          onClick={() => navigate('/artist')}
          className={`btn-nav ${location.pathname === '/artist' ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('artist_layout_dashboard')}
        </button>
        <button
          onClick={() => navigate('/artist/edit')}
          className={`btn-nav ${location.pathname === '/artist/edit' ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('artist_layout_edit_profile')}
        </button>
        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
        <button
          onClick={() => navigate('/profile')}
          className={`btn-nav ${location.pathname === '/profile' ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('nav.profile')}
        </button>
        <button
          onClick={() => navigate('/wallet')}
          className={`btn-nav ${location.pathname === '/wallet' ? 'active' : ''}`}
          style={{
            padding: '12px',
            textAlign: 'left',
            borderRadius: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            width: '100%',
          }}
        >
          {t('nav.wallet')}
        </button>
      </nav>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <aside
        className="glass-panel"
        style={{ width: '250px', padding: '24px', display: 'flex', flexDirection: 'column' }}
      >
        <h2 style={{ margin: '0 0 32px 0' }}>{activeEntity?.name || t('nav.title')}</h2>
        {renderSidebarNav()}

        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{
            marginTop: 'auto',
            borderColor: 'var(--text-danger)',
            color: 'var(--text-danger)',
          }}
        >
          {t('nav.logout')}
        </button>
      </aside>

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <EntitySwitcher onEntityChange={handleEntityChange} />
        </header>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {activeEntity ? (
            <Outlet context={{ activeEntity, claim }} />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <h3>{t('artist_layout_no_profile')}</h3>
              <p>{t('artist_layout_manage_desc')}</p>
              <Link
                to="/claim"
                className="btn-primary"
                style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}
              >
                {t('artist_layout_claim')}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
