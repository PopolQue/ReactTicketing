import React from 'react';
import { supabase } from '../lib/supabase';
import { Sidebar } from './Sidebar';
import { Feed } from './Feed';
import MarketplaceHome from '../pages/marketplace/Home';

export const AppHome = () => {
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return session ? (
    <div style={{ display: 'flex' }}>
      <main style={{ flex: 1, padding: '20px' }}>
        <Feed />
      </main>
    </div>
  ) : (
    <MarketplaceHome />
  );
};
