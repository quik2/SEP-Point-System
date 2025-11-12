# SEP Point System

A modern, real-time point tracking system for fraternity/sorority member attendance and engagement.

## Features

- **Live Leaderboard**: Beautiful, animated public leaderboard with real-time updates
- **Admin Dashboard**: Comprehensive admin interface for managing points and attendance
- **Attendance Tracking**: Easy-to-use grid system for marking attendance at events
- **Manual Point Adjustments**: Ability to add or subtract points with detailed reasoning
- **Point History Log**: Complete audit trail with filtering, search, and CSV export
- **Real-time Updates**: Uses Supabase real-time subscriptions for instant updates
- **Dark Mode UI**: Modern tech startup aesthetic with vibrant colors and smooth animations

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Chakra UI, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Getting Started

### 1. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# Open supabase-schema.sql and run it in your Supabase dashboard
# This will create all necessary tables and insert the initial member data
```

### 2. Environment Variables

The `.env.local` file is already configured with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mxhswvqdxjqzrkjtyrpf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=SEP2025
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the public leaderboard.

Access the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin) (password: SEP2025)

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel will auto-detect Next.js and configure everything
4. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
5. Deploy!

## Point System Rules

### Active Meeting
- **Absent**: -5 points
- **Excused Absent**: -1 point
- **Late**: -2 points
- **Excused Late**: -1 point
- **Present**: 0 points
- **INACTIVE**: No point change, member status updated

### Adding More Event Types

Edit `lib/pointRules.ts` to add new event types with custom point rules.

## Admin Dashboard Features

### Attendance Tracker
- Select event type (Active Meeting, Social Event, or Custom)
- Name your event (e.g., "Week 2", "Fall Mixer")
- Mark attendance for all members using dropdown menus
- Points are automatically calculated and applied based on rules

### Point Adjuster
- Select any member
- Add or subtract points with custom amounts
- Provide a reason for the adjustment
- See real-time preview of new point total

### Point History Log
- View complete history of all point changes
- Filter by specific member
- Search by member name, event, or reason
- Export data to CSV for external analysis

## Project Structure

```
SEP-Point-System/
├── app/
│   ├── page.tsx                    # Public leaderboard
│   ├── admin/
│   │   └── page.tsx                # Admin dashboard
│   ├── api/
│   │   ├── auth/route.ts           # Admin authentication
│   │   ├── attendance/route.ts     # Attendance submission
│   │   ├── adjust-points/route.ts  # Manual point adjustments
│   │   ├── members/route.ts        # Member data API
│   │   └── point-history/route.ts  # Point history API
│   ├── layout.tsx                  # Root layout
│   └── providers.tsx               # Chakra UI provider
├── components/
│   ├── AttendanceGrid.tsx          # Attendance tracking component
│   ├── PointAdjuster.tsx           # Point adjustment component
│   └── PointHistoryLog.tsx         # Point history component
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── pointRules.ts               # Point calculation rules
│   └── theme.ts                    # Chakra UI theme
├── types/
│   └── index.ts                    # TypeScript types
└── supabase-schema.sql             # Database schema
```

## Customization

### Changing Admin Password

Update the `ADMIN_PASSWORD` in `.env.local` or in Vercel environment variables.

### Adding New Members

Add members directly in Supabase or via the admin dashboard (future feature).

### Modifying Point Rules

Edit `lib/pointRules.ts` to change point deductions/additions for different attendance statuses.

### Styling

Modify `lib/theme.ts` to change colors, fonts, and other theme settings.

## Support

For issues or questions, contact the developer or check the Supabase and Next.js documentation.

## License

MIT
