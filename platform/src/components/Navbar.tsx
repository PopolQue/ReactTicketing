import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);
    }
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h2 style={{ margin: 0, letterSpacing: '-0.5px' }}>
          Admit <span style={{ color: 'var(--accent)' }}>Marketplace</span>
        </h2>
      </Link>
      <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link to="/discover" className="btn-nav">Discover</Link>
        <Link to="/resale" className="btn-nav">Secondary Market</Link>
        <Link to="/blogs" className="btn-nav">Editorials</Link>
        {user ? (
          <>
            <Link to="/wallet" className="btn-secondary" style={{ textDecoration: 'none' }}>My Wallet</Link>
            <Link to="/organizer" className="btn-secondary" style={{ textDecoration: 'none' }}>Organizer Dashboard</Link>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <Link to="/auth" className="btn-primary" style={{ textDecoration: 'none' }}>Log In / Sign Up</Link>
        )}
      </nav>
    </header>
  );
}
