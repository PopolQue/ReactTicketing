import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import './index.css'

// Organizer Components
import OrganizerLayout from './pages/organizer/OrganizerLayout'
import Dashboard from './pages/organizer/Dashboard'
import EventsList from './pages/organizer/EventsList'
import CreateEvent from './pages/organizer/CreateEvent'
import ManageEvent from './pages/organizer/ManageEvent'

// Auth
import Auth from './pages/auth/Auth'

// Artist Portal
import ArtistLayout from './pages/artist/ArtistLayout'
import ArtistDashboard from './pages/artist/ArtistDashboard'
import ArtistEditProfile from './pages/artist/ArtistEditProfile'

import Home from './pages/marketplace/Home'
import Discover from './pages/marketplace/Discover'
import EventDetails from './pages/marketplace/EventDetails'
import ArtistProfile from './pages/marketplace/ArtistProfile'
import VenueProfile from './pages/marketplace/VenueProfile'
import OrganizerProfile from './pages/marketplace/OrganizerProfile'
import Wallet from './pages/fan/Wallet'
import ResaleMarket from './pages/marketplace/ResaleMarket'
import ClaimPortal from './pages/marketplace/ClaimPortal'

import Settings from './pages/organizer/Settings'
import ScanTickets from './pages/organizer/ScanTickets'
import ArtistsList from './pages/organizer/ArtistsList'
import BlogsList from './pages/organizer/BlogsList'
import MarketingAndAnalytics from './pages/organizer/MarketingAndAnalytics'
import BlogFeed from './pages/marketplace/BlogFeed'
import BlogPost from './pages/marketplace/BlogPost'

// Venue Portal
import VenueLayout from './pages/venue/VenueLayout'
import VenueDashboard from './pages/venue/VenueDashboard'

// Admin & Support
import ContactSupport from './pages/support/ContactSupport'
import AdminLayout from './pages/admin/AdminLayout'
import EventReview from './pages/admin/EventReview'
import SupportDesk from './pages/admin/SupportDesk'
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout'
import AdminManagement from './pages/superadmin/AdminManagement'
import EntityClaims from './pages/admin/EntityClaims'
import { ToastProvider } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

import MarketplaceLayout from './components/MarketplaceLayout'

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
        {/* Public Fan Marketplace */}
        <Route element={<MarketplaceLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/artist/:id" element={<ArtistProfile />} />
          <Route path="/venue/:id" element={<VenueProfile />} />
          <Route path="/organizer/:id" element={<OrganizerProfile />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/wallet" element={<Wallet />} />
          </Route>
          <Route path="/resale" element={<ResaleMarket />} />
          <Route path="/blogs" element={<BlogFeed />} />
          <Route path="/blogs/:slug" element={<BlogPost />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/claim" element={<ClaimPortal />} />
        </Route>

        {/* Organizer Portal */}
        <Route element={<ProtectedRoute />}>
          <Route path="/organizer" element={<OrganizerLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="events" element={<EventsList />} />
            <Route path="events/new" element={<CreateEvent />} />
            <Route path="events/:id" element={<ManageEvent />} />
            <Route path="scan" element={<ScanTickets />} />
            <Route path="settings" element={<Settings />} />
            <Route path="marketing" element={<MarketingAndAnalytics />} />
            <Route path="artists" element={<ArtistsList />} />
            <Route path="blogs" element={<BlogsList />} />
          </Route>
        </Route>

        {/* Artist Portal */}
        <Route element={<ProtectedRoute />}>
          <Route path="/artist" element={<ArtistLayout />}>
            <Route index element={<ArtistDashboard />} />
            <Route path="edit" element={<ArtistEditProfile />} />
          </Route>
        </Route>

        {/* Venue Portal */}
        <Route element={<ProtectedRoute />}>
          <Route path="/venue" element={<VenueLayout />}>
            <Route index element={<VenueDashboard />} />
          </Route>
        </Route>

        {/* Public Support */}
        <Route path="/support" element={<ContactSupport />} />

        {/* Admin Portal */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div style={{ padding: '24px' }}><h1>Admin Dashboard</h1><p>Welcome to the Admit employee portal. Select an option from the sidebar to manage events or support tickets.</p></div>} />
            <Route path="events" element={<EventReview />} />
            <Route path="support" element={<SupportDesk />} />
            <Route path="claims" element={<EntityClaims />} />
          </Route>
        </Route>

        {/* SuperAdmin Portal */}
        <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route index element={<div style={{ padding: '24px' }}><h1>SuperAdmin Dashboard</h1><p>Welcome to the top-level management dashboard. Here you can monitor system metrics and manage admins.</p></div>} />
            <Route path="admins" element={<AdminManagement />} />
          </Route>
        </Route>
      </Routes>
    </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
