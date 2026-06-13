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
import ResaleMarket from './pages/marketplace/ResaleMarket'

import Settings from './pages/organizer/Settings'
import ScanTickets from './pages/organizer/ScanTickets'
import ArtistsList from './pages/organizer/ArtistsList'
import BlogsList from './pages/organizer/BlogsList'
import BlogFeed from './pages/marketplace/BlogFeed'
import BlogPost from './pages/marketplace/BlogPost'

// Admin & Support
import ContactSupport from './pages/support/ContactSupport'
import AdminLayout from './pages/admin/AdminLayout'
import EventReview from './pages/admin/EventReview'
import SupportDesk from './pages/admin/SupportDesk'
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout'
import AdminManagement from './pages/superadmin/AdminManagement'
import { ToastProvider } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
        {/* Public Fan Marketplace */}
        <Route path="/" element={<Home />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/resale" element={<ResaleMarket />} />
        <Route path="/blogs" element={<BlogFeed />} />
        <Route path="/blogs/:slug" element={<BlogPost />} />
        <Route path="/auth" element={<Auth />} />

        {/* Organizer Portal */}
        <Route path="/organizer" element={<OrganizerLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="events" element={<EventsList />} />
          <Route path="events/new" element={<CreateEvent />} />
          <Route path="events/:id" element={<ManageEvent />} />
          <Route path="scan" element={<ScanTickets />} />
          <Route path="settings" element={<Settings />} />
          <Route path="artists" element={<ArtistsList />} />
          <Route path="blogs" element={<BlogsList />} />
        </Route>

        {/* Public Support */}
        <Route path="/support" element={<ContactSupport />} />

        {/* Admin Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div style={{ padding: '24px' }}><h1>Admin Dashboard</h1><p>Welcome to the Admit employee portal. Select an option from the sidebar to manage events or support tickets.</p></div>} />
          <Route path="events" element={<EventReview />} />
          <Route path="support" element={<SupportDesk />} />
        </Route>

        {/* SuperAdmin Portal */}
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<div style={{ padding: '24px' }}><h1>SuperAdmin Dashboard</h1><p>Welcome to the top-level management dashboard. Here you can monitor system metrics and manage admins.</p></div>} />
          <Route path="admins" element={<AdminManagement />} />
        </Route>
      </Routes>
    </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
