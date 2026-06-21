import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

export function useAdminData() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('user_roles').select('id, user_id, role, created_at');

    if (data) {
      const adminIds = data.map((d) => d.user_id);

      const { data: events } = await supabase
        .from('events')
        .select('reviewed_by')
        .in('reviewed_by', adminIds);

      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('assigned_admin_id')
        .eq('status', 'resolved')
        .in('assigned_admin_id', adminIds);

      const adminsWithMetrics = data.map((admin) => {
        const eventsReviewed = events?.filter((e) => e.reviewed_by === admin.user_id).length || 0;
        const ticketsResolved =
          tickets?.filter((t) => t.assigned_admin_id === admin.user_id).length || 0;
        return { ...admin, eventsReviewed, ticketsResolved };
      });

      setAdmins(adminsWithMetrics);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const promoteUser = async (emailToPromote: string) => {
    if (!emailToPromote) return false;

    const { data, error } = await supabase.rpc('promote_admin_by_email', {
      target_email: emailToPromote,
    });

    if (error) {
      showToast(error.message || 'Failed to promote user.', 'error');
      return false;
    } else {
      showToast('User promoted to admin successfully!', 'success');
      fetchAdmins();
      return true;
    }
  };

  const removeRole = async (id: string, role: string) => {
    if (role === 'superadmin') {
      showToast('Cannot remove a superadmin.', 'error');
      return;
    }

    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) {
      showToast('Error removing admin', 'error');
    } else {
      showToast('Admin access revoked', 'success');
      fetchAdmins();
    }
  };

  return {
    admins,
    loading,
    promoteUser,
    removeRole,
  };
}
