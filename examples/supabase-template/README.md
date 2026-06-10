# ReactTicket Supabase Template

This is a starter template for integrating `ReactTicket` with a Supabase backend.

## Setup Instructions

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   cd examples/supabase-template
   npm install
   ```
3. **Configure Environment:**
   Create a `.env` file in this directory and add your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```
4. **Database Setup:**
   Ensure your Supabase database has the tables defined in `supabase/migrations/20260610000000_init_schema.sql` (found in the project root).
5. **Run the demo:**
   ```bash
   npm run dev
   ```
