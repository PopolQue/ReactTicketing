import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { ShieldCheck, RefreshCw, Palette } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);
    }
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <h2 style={{ margin: 0, letterSpacing: '-0.5px' }}>
          Admit <span style={{ color: 'var(--accent)' }}>Marketplace</span>
        </h2>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/discover" className="btn-nav">Discover</Link>
          <Link to="/resale" className="btn-nav">Secondary Market</Link>
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

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '60px 20px', overflow: 'hidden' }}>
        {/* Background glow effects */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(192,132,252,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '800px', animation: 'fadeIn 1s ease-out' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '30px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', marginBottom: '24px', border: '1px solid rgba(99,102,241,0.3)' }}>
            THE FUTURE OF TICKETING
          </span>
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', margin: '0 0 24px 0', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-2px' }}>
            Unforgettable <br/> <span style={{ background: 'linear-gradient(to right, #6366f1, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Experiences Await</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto', lineHeight: 1.6 }}>
            Discover underground club nights, massive festivals, and intimate live shows. Securely buy and seamlessly resell tickets on the world's most elegant marketplace.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/discover" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.2rem', borderRadius: '30px', transition: 'transform 0.2s', boxShadow: '0 10px 30px -10px rgba(99,102,241,0.5)' }}>
              Start Discovering
            </Link>
            <Link to="/organizer" className="btn-secondary" style={{ padding: '16px 40px', fontSize: '1.2rem', borderRadius: '30px' }}>
              Host an Event
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', width: '100%', maxWidth: '1200px', marginTop: '100px', zIndex: 1 }}>
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#6366f1' }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.3rem' }}>Secure Ecosystem</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Every ticket is verified and cryptographically signed. Say goodbye to fake PDF tickets.</p>
          </div>
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(192,132,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#c084fc' }}>
              <RefreshCw size={32} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.3rem' }}>Fair Resale Market</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Can't make it? Resell your ticket safely through our built-in secondary marketplace.</p>
          </div>
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#34d399' }}>
              <Palette size={32} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.3rem' }}>Stunning UI</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Experience a meticulously crafted platform that prioritizes both aesthetics and usability.</p>
          </div>
        </div>

        {/* Creator Features Section */}
        <div style={{ marginTop: '120px', width: '100%', maxWidth: '1200px', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 16px 0' }}>Built for Organizers & Artists</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
              Admit isn't just a ticket store—it's a comprehensive ecosystem designed to empower creators.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div className="glass-panel" style={{ padding: '40px', borderTop: '4px solid #6366f1' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white' }}>Custom Checkouts</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Go beyond Name and Email. Our dynamic Form Builder lets organizers demand precise ticket holder information like Age, Country, Dietary Restrictions, and Custom Responses directly in the shopping cart.
              </p>
            </div>
            
            <div className="glass-panel" style={{ padding: '40px', borderTop: '4px solid #c084fc' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white' }}>Lineup Management</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Organizers can instantly generate placeholder profiles for every act on their lineup to launch events immediately without waiting for artists to register.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '40px', borderTop: '4px solid #10b981' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white' }}>Entity Claiming</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Artists, Venues, and Organizers can search the platform to "Claim" their automatically generated profiles. Once verified by our team, they unlock full control over their pages and exclusive dashboards with deep Audience Analytics.
              </p>
              <Link to="/claim" className="btn-secondary" style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.9rem' }}>Go to Claim Portal →</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
