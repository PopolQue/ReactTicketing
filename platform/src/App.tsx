import { Routes, Route, Link } from 'react-router-dom'
import './App.css'

// Organizer Components
import OrganizerLayout from './pages/organizer/OrganizerLayout'
import Dashboard from './pages/organizer/Dashboard'
import EventsList from './pages/organizer/EventsList'
import CreateEvent from './pages/organizer/CreateEvent'
import ManageEvent from './pages/organizer/ManageEvent'

// Auth
import Auth from './pages/auth/Auth'

import Home from './pages/marketplace/Home'
import EventDetails from './pages/marketplace/EventDetails'
import Wallet from './pages/fan/Wallet'

function Settings() {
  return (
    <div className="settings-page">
      <h2>Settings & Payouts</h2>
      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px', maxWidth: '600px' }}>
        <h3>Stripe Connect</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Connect your Stripe account to receive payouts automatically.</p>
        <button className="btn-primary" style={{ marginTop: '16px' }}>Connect with Stripe</button>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Public Fan Marketplace */}
      <Route path="/" element={<Home />} />
      <Route path="/events/:id" element={<EventDetails />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Organizer Portal */}
      <Route path="/organizer" element={<OrganizerLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="events" element={<EventsList />} />
        <Route path="events/new" element={<CreateEvent />} />
        <Route path="events/:id" element={<ManageEvent />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
