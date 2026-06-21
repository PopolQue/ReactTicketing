import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'superadmin')) {
        navigate('/'); // Redirect non-admins to home
      } else {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [navigate]);

  if (loading)
    return <div style={{ padding: '60px', textAlign: 'center' }}>{t('admin_layout_loading')}</div>;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid var(--border)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', marginBottom: '32px', color: 'var(--accent)' }}>
          {t('admin_layout_title')}
        </h2>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            to="/admin"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: isActive('/admin') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            {t('admin_layout_dashboard')}
          </Link>
          <Link
            to="/admin/events"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: isActive('/admin/events') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            {t('admin_layout_event_review')}
          </Link>
          <Link
            to="/admin/support"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: isActive('/admin/support') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            {t('admin_layout_support_desk')}
          </Link>
          <Link
            to="/admin/claims"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: isActive('/admin/claims') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            {t('admin_layout_entity_claims')}
          </Link>
          <Link
            to="/admin/writer-applications"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: isActive('/admin/writer-applications')
                ? 'rgba(255,255,255,0.1)'
                : 'transparent',
            }}
          >
            {t('admin_layout_writer_apps')}
          </Link>
          <Link
            to="/admin/invites"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: isActive('/admin/invites') ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            Invite Manager
          </Link>
        </nav>

        <div
          style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}
        >
          <Link
            to="/"
            className="btn-nav"
            style={{ padding: '8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
          >
            {t('admin_layout_back')}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
