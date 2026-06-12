import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    ticketsSold: 0,
    totalRevenueCents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch all events for this organizer
      const { data: eventsData } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', user.id);

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

      setStats({
        totalEvents: eventIds.length,
        ticketsSold,
        totalRevenueCents
      });
      setLoading(false);
    }
    
    fetchAnalytics();
  }, []);

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
        <h3>Recent Activity</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
          {stats.ticketsSold === 0 ? "You haven't sold any tickets yet." : "Live sales feed will appear here."}
        </p>
      </div>
    </div>
  );
}
