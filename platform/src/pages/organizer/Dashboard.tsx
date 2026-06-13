import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';

export default function Dashboard() {
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const [stats, setStats] = useState({
    totalEvents: 0,
    ticketsSold: 0,
    totalRevenueCents: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!activeEntity) return;

      // 1. Fetch all events for this organizer
      const { data: eventsData } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', activeEntity.id);

      if (!eventsData || eventsData.length === 0) {
        setLoading(false);
        return;
      }

      const eventIds = eventsData.map(e => e.id);

      // 2. Fetch all tickets sold for these events
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('price_paid_cents')
        .in('event_id', eventIds);

      const ticketsSold = ticketsData?.length || 0;
      const totalRevenueCents = ticketsData?.reduce((acc, ticket) => acc + (ticket.price_paid_cents || 0), 0) || 0;

      // 3. Fetch recent sales (latest 5 tickets)
      const { data: recentTickets } = await supabase
        .from('tickets')
        .select(`
          id,
          price_paid_cents,
          issued_at,
          buyer_email,
          events ( name ),
          ticket_types ( name )
        `)
        .in('event_id', eventIds)
        .order('issued_at', { ascending: false })
        .limit(5);

      if (recentTickets) setRecentSales(recentTickets);

      setStats({
        totalEvents: eventIds.length,
        ticketsSold,
        totalRevenueCents
      });
      setLoading(false);
    }
    
    fetchAnalytics();

    // Subscribe to new tickets (Realtime)
    const channel = supabase.channel('dashboard_sales')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, payload => {
        // Optimistically refresh stats
        fetchAnalytics(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeEntity]);

  if (loading) return <div style={{ padding: '24px' }}>Loading Analytics...</div>;

  return (
    <div className="dashboard-page">
      <h2 style={{ marginBottom: '24px', margin: 0 }}>Overview</h2>
      
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Revenue</p>
          <h3 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--accent)' }}>€{(stats.totalRevenueCents / 100).toFixed(2)}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Tickets Sold</p>
          <h3 style={{ margin: 0, fontSize: '2.5rem' }}>{stats.ticketsSold}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Events</p>
          <h3 style={{ margin: 0, fontSize: '2.5rem' }}>{stats.totalEvents}</h3>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Recent Activity</h3>
        {recentSales.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>You haven't sold any tickets yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentSales.map((sale: any) => (
              <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>{sale.events?.name}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {sale.buyer_email} • {sale.ticket_types?.name}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--accent)' }}>
                    +€{((sale.price_paid_cents || 0) / 100).toFixed(2)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(sale.issued_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
