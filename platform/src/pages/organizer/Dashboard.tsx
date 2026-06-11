import React from 'react';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <p className="stat-label">Total Revenue</p>
          <h2 className="stat-value">€12,450.00</h2>
        </div>
        <div className="stat-card glass-panel">
          <p className="stat-label">Tickets Sold</p>
          <h2 className="stat-value">342</h2>
        </div>
        <div className="stat-card glass-panel">
          <p className="stat-label">Active Events</p>
          <h2 className="stat-value">2</h2>
        </div>
      </div>
    </div>
  );
}
