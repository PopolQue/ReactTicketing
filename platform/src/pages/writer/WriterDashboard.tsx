import React from 'react';
import BlogsList from '../organizer/BlogsList';

export default function WriterDashboard() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>Writer Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Manage your editorial posts and publish new articles.
        </p>
      </div>
      <BlogsList />
    </div>
  );
}
