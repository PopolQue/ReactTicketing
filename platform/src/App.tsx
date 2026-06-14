import React, { Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import './index.css'

// Organizer Components
const OrganizerLayout = React.lazy(() => import('./pages/organizer/OrganizerLayout'))
const Dashboard = React.lazy(() => import('./pages/organizer/Dashboard'))
const EventsList = React.lazy(() => import('./pages/organizer/EventsList'))
const CreateEvent = React.lazy(() => import('./pages/organizer/CreateEvent'))
const ManageEvent = React.lazy(() => import('./pages/organizer/ManageEvent'))
const PromosFullPage = React.lazy(() => import('./pages/organizer/PromosFullPage'))

// Auth
import Auth from './pages/auth/Auth'

// Artist Portal
const ArtistLayout = React.lazy(() => import('./pages/artist/ArtistLayout'))
const ArtistDashboard = React.lazy(() => import('./pages/artist/ArtistDashboard'))
const ArtistEditProfile = React.lazy(() => import('./pages/artist/ArtistEditProfile'))

import Home from './pages/marketplace/Home'
import Discover from './pages/marketplace/Discover'
import EventDetails from './pages/marketplace/EventDetails'
import ArtistProfile from './pages/marketplace/ArtistProfile'
import VenueProfile from './pages/marketplace/VenueProfile'
import OrganizerProfile from './pages/marketplace/OrganizerProfile'
import Wallet from './pages/fan/Wallet'
import ResaleMarket from './pages/marketplace/ResaleMarket'
import ClaimPortal from './pages/marketplace/ClaimPortal'
import WriterApplication from './pages/marketplace/WriterApplication'
import ScanPage from './pages/marketplace/ScanPage'

const Settings = React.lazy(() => import('./pages/organizer/Settings'))
const ScanTickets = React.lazy(() => import('./pages/organizer/ScanTickets'))
const ArtistsList = React.lazy(() => import('./pages/organizer/ArtistsList'))
const BlogsList = React.lazy(() => import('./pages/organizer/BlogsList'))
const MarketingAndAnalytics = React.lazy(() => import('./pages/organizer/MarketingAndAnalytics'))
import BlogFeed from './pages/marketplace/BlogFeed'
import BlogPost from './pages/marketplace/BlogPost'

// Legal & Utility Pages
const Imprint = React.lazy(() => import('./pages/legal/Imprint'))
const Privacy = React.lazy(() => import('./pages/legal/Privacy'))
const Terms = React.lazy(() => import('./pages/legal/Terms'))
const SitemapPage = React.lazy(() => import('./pages/legal/Sitemap'))

// Venue Portal
const VenueLayout = React.lazy(() => import('./pages/venue/VenueLayout'))
const VenueDashboard = React.lazy(() => import('./pages/venue/VenueDashboard'))

// Admin & Support
const ContactSupport = React.lazy(() => import('./pages/support/ContactSupport'))
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'))
const EventReview = React.lazy(() => import('./pages/admin/EventReview'))
const SupportDesk = React.lazy(() => import('./pages/admin/SupportDesk'))
const SuperAdminLayout = React.lazy(() => import('./pages/superadmin/SuperAdminLayout'))
const AdminManagement = React.lazy(() => import('./pages/superadmin/AdminManagement'))
const EntityClaims = React.lazy(() => import('./pages/admin/EntityClaims'))
const WriterApplicationsReview = React.lazy(() => import('./pages/admin/WriterApplicationsReview'))
const WriterLayout = React.lazy(() => import('./pages/writer/WriterLayout'))
const WriterDashboard = React.lazy(() => import('./pages/writer/WriterDashboard'))
import { ToastProvider } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

import MarketplaceLayout from './components/MarketplaceLayout'

// Marketing Pages
const ForArtists = React.lazy(() => import('./pages/marketing/ForArtists'))
const ForFans = React.lazy(() => import('./pages/marketing/ForFans'))
const ForOrganizers = React.lazy(() => import('./pages/marketing/ForOrganizers'))
const ForVenues = React.lazy(() => import('./pages/marketing/ForVenues'))

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<div style={{padding: '24px'}}>Loading module...</div>}>
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
          <Route path="/apply/writer" element={<WriterApplication />} />
          <Route path="/scan/:id" element={<ScanPage />} />
          <Route path="/for-artists" element={<ForArtists />} />
          <Route path="/for-fans" element={<ForFans />} />
          <Route path="/for-organizers" element={<ForOrganizers />} />
          <Route path="/for-venues" element={<ForVenues />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/sitemap" element={<SitemapPage />} />
        </Route>

        {/* Organizer Portal */}
        <Route element={<ProtectedRoute />}>
          <Route path="/organizer" element={<OrganizerLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="events" element={<EventsList />} />
            <Route path="events/new" element={<CreateEvent />} />
            <Route path="events/:id" element={<ManageEvent />} />
            <Route path="events/:id/promos" element={<PromosFullPage />} />
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

          {/* Writer Portal */}
          <Route path="/writer" element={<WriterLayout />}>
            <Route index element={<WriterDashboard />} />
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
            <Route path="writer-applications" element={<WriterApplicationsReview />} />
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
        </Suspense>
    </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
