import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bell, Check, Trash2 } from 'lucide-react';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
  }

  const markAsRead = async (id: string, link?: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (link) navigate(link);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          position: 'relative',
          padding: '8px',
        }}
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: 'var(--text-danger)',
              color: 'white',
              borderRadius: '50%',
              fontSize: '0.7rem',
              padding: '2px 5px',
            }}
          >
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            width: '320px',
            background: 'rgb(20, 20, 20)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            zIndex: 1000,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}
        >
          <h4 style={{ margin: '0 0 16px 0' }}>Notifications</h4>
          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No new notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div
                  onClick={() => markAsRead(n.id, n.link)}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  <strong>{n.title}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{n.message}</p>
                </div>
                <button
                  onClick={() => markAsRead(n.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Check size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
