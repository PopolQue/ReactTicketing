import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '../contexts/LanguageContext';
import Dropdown from './Dropdown';
import { NotificationBell } from './NotificationBell';
import EntitySwitcher from './EntitySwitcher';
import { usePostHog } from '@posthog/react';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const posthog = usePostHog();

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        posthog?.identify(currentUser.id, { email: currentUser.email });
      }
    }
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        posthog?.identify(session.user.id, { email: session.user.email });
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [posthog]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header
      style={{
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Left Group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2 style={{ margin: 0 }}>Admit</h2>
        </Link>
        <div style={{ width: '60px' }}>
          <Dropdown
            value={language}
            onChange={(v) => setLanguage(v as string)}
            options={[
              { value: 'en', label: 'EN' },
              { value: 'de', label: 'DE' },
            ]}
          />
        </div>
      </div>

      {/* Right Group */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/discover" style={{ textDecoration: 'none', color: 'inherit' }}>
          {t('nav.discover')}
        </Link>
        <Link to="/blogs" style={{ textDecoration: 'none', color: 'inherit' }}>
          {t('nav.blogs')}
        </Link>

        {user ? (
          <>
            <NotificationBell />
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '24px' }}>
              <EntitySwitcher />
            </div>
          </>
        ) : (
          <Link to="/auth" className="btn-primary">
            {t('nav.login')}
          </Link>
        )}
      </nav>
    </header>
  );
}
