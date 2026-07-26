import { useLanguage } from '../contexts/LanguageContext';
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
interface Props {
  allowedRoles?: string[];
  requireAuth?: boolean;
}
export default function ProtectedRoute({ allowedRoles, requireAuth = true }: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (requireAuth) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
        setLoading(false);
        return;
      }

      // If just auth is required and no specific roles are given
      if (!allowedRoles || allowedRoles.length === 0) {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      // If specific roles are required, check the user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      const userRole = roleData?.role || 'user';
      if (allowedRoles.includes(userRole)) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    }
    checkAuth();
  }, [location.pathname]);
  if (loading)
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
        }}
      >
        {t('authenticating')}
      </div>
    );
  if (!authorized) {
    return (
      <Navigate
        to="/auth"
        state={{
          from: location,
        }}
        replace
      />
    );
  }
  return <Outlet />;
}
