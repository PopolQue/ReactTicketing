import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SuperAdminLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSuperAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!roleData || roleData.role !== 'superadmin') {
        navigate('/'); // Redirect non-superadmins
      } else {
        setLoading(false);
      }
    }
    checkSuperAdmin();
  }, [navigate]);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>{t('super_admin_layout_loading')}</div>;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: '#1e1b4b', borderRight: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '32px', color: '#c084fc' }}>{t('super_admin_layout_title')}</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link 
            to="/superadmin" 
            style={{ 
              padding: '12px 16px', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              color: 'white',
              backgroundColor: isActive('/superadmin') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >{t('super_admin_layout_dashboard')}</Link>
          <Link 
            to="/superadmin/admins" 
            style={{ 
              padding: '12px 16px', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              color: 'white',
              backgroundColor: isActive('/superadmin/admins') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            {t('super_admin_layout_admins')}
          </Link>
          <Link 
            to="/admin" 
            style={{ 
              padding: '12px 16px', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              color: 'var(--text-secondary)',
            }}
          >
            {t('super_admin_layout_go_admin')}
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <Link to="/" className="btn-nav" style={{ padding: '8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('super_admin_layout_back')}
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
