import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '../contexts/LanguageContext';
import Dropdown from './Dropdown';
export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const {
    language,
    setLanguage,
    t
  } = useLanguage();
  useEffect(() => {
    async function checkUser() {
      const {
        data: {
          user: currentUser
        }
      } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);
    }
    checkUser();
    const {
      data: authListener
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  return <header style={{
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  }}>
      <Link to="/" style={{
      textDecoration: 'none',
      color: 'inherit'
    }}>
        <h2 style={{
        margin: 0,
        letterSpacing: '-0.5px'
      }}>{t("admit")}<span style={{
          color: 'var(--accent)'
        }}>{t("marketplaceLabel")}</span>
        </h2>
      </Link>
      <nav style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    }}>
        <div style={{
        width: '80px',
        marginRight: '16px'
      }}>
          <Dropdown value={language} onChange={v => setLanguage(v as any)} options={[{
          value: 'en',
          label: 'EN'
        }, {
          value: 'de',
          label: 'DE'
        }, {
          value: 'es',
          label: 'ES'
        }, {
          value: 'fr',
          label: 'FR'
        }]} />
        </div>
        <Link to="/discover" className="btn-nav">{t('nav.discover')}</Link>
        <Link to="/resale" className="btn-nav">{t('nav.resale')}</Link>
        <Link to="/blogs" className="btn-nav">{t('nav.blogs')}</Link>
        {user ? <>
            <Link to="/wallet" className="btn-secondary" style={{
          textDecoration: 'none'
        }}>{t('nav.wallet')}</Link>
            <Link to="/organizer" className="btn-secondary" style={{
          textDecoration: 'none'
        }}>{t('nav.organizer')}</Link>
            <button onClick={handleLogout} style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer'
        }}>{t('nav.logout')}</button>
          </> : <Link to="/auth" className="btn-primary" style={{
        textDecoration: 'none'
      }}>{t('nav.login')}</Link>}
      </nav>
    </header>;
}