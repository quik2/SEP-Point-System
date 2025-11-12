# SEP Point System - Claude Project Documentation

## Project Overview

A modern, real-time fraternity point tracking system built with Next.js, TypeScript, Chakra UI, and Supabase.

**Created**: January 2025
**Framework**: Next.js 14 (App Router)
**Database**: Supabase (PostgreSQL)
**Deployment**: Vercel

## Project Structure

```
SEP-Point-System/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Public leaderboard (main page)
│   ├── admin/page.tsx            # Admin dashboard (password protected)
│   ├── api/                      # API routes
│   │   ├── auth/route.ts         # Simple password authentication
│   │   ├── attendance/route.ts   # Process attendance submissions
│   │   ├── adjust-points/route.ts # Manual point adjustments
│   │   ├── members/route.ts      # Fetch member data
│   │   └── point-history/route.ts # Point history with filtering
│   ├── layout.tsx                # Root layout with Chakra Provider
│   └── providers.tsx             # Client-side Chakra Provider
│
├── components/                   # React components
│   ├── AttendanceGrid.tsx        # Attendance tracking interface
│   ├── PointAdjuster.tsx         # Manual point adjustment UI
│   └── PointHistoryLog.tsx       # Point history table with export
│
├── lib/                          # Utilities and configuration
│   ├── supabase.ts              # Supabase client setup
│   ├── pointRules.ts            # Point calculation rules engine
│   └── theme.ts                 # Chakra UI dark theme configuration
│
├── types/
│   └── index.ts                 # TypeScript type definitions
│
└── supabase-schema.sql          # Database schema (run in Supabase)
```

## Key Features

### 1. Public Leaderboard (/)
- **Real-time updates** using Supabase realtime subscriptions
- **Animated UI** with Framer Motion
- Only shows **active** members
- Displays rank, name, points, and rank changes
- Top 3 get special trophy/medal icons
- Members below 80 points marked "At Risk"

### 2. Admin Dashboard (/admin)
- **Simple password authentication** (no user accounts)
- Three main sections:
  1. **Attendance Tracker**: Mark attendance for all members, auto-calculate points
  2. **Point Adjuster**: Manually add/subtract points with reasoning
  3. **Point History**: View/search/export all point changes

### 3. Point System Rules
Defined in `lib/pointRules.ts`:

**Active Meeting:**
- Present: 0 points
- Absent: -5 points
- Late: -2 points
- Excused Absent: -1 point
- Excused Late: -1 point
- INACTIVE: No points, status changes

**Social Event:**
- Present: 0 points
- Absent: -3 points
- Late: -1 point
- Excused Absent: -1 point
- Excused Late: 0 points

## Database Schema

### Tables

1. **members**
   - id (UUID, primary key)
   - name (TEXT)
   - points (INTEGER, default 100)
   - status ('active' | 'inactive')
   - rank_change (INTEGER, for up/down arrows)
   - created_at, updated_at (TIMESTAMP)

2. **events**
   - id (UUID, primary key)
   - name (TEXT) - e.g., "Week 2", "Fall Mixer"
   - event_type (TEXT) - e.g., "Active Meeting"
   - date (TIMESTAMP)
   - created_at (TIMESTAMP)

3. **attendance_records**
   - id (UUID, primary key)
   - event_id (UUID, foreign key)
   - member_id (UUID, foreign key)
   - status (TEXT) - 'present', 'absent', 'late', etc.
   - points_change (INTEGER)
   - created_at (TIMESTAMP)
   - Unique constraint on (event_id, member_id)

4. **point_history**
   - id (UUID, primary key)
   - member_id (UUID, foreign key)
   - event_id (UUID, nullable foreign key)
   - points_change (INTEGER)
   - reason (TEXT)
   - new_total (INTEGER)
   - timestamp (TIMESTAMP)

### Row Level Security (RLS)

- **Public read access**: members and point_history tables
- **Service role write access**: All operations use service role key for admin actions
- Anonymous users can only read leaderboard data

## Environment Variables

Required in `.env.local` and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mxhswvqdxjqzrkjtyrpf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ADMIN_PASSWORD=SEP2025
```

## API Routes

### POST /api/auth
Validates admin password. Returns `{ success: boolean }`

### GET /api/members
Query params: `includeInactive=true` (optional)
Returns all members, optionally including inactive ones.

### POST /api/attendance
Body:
```typescript
{
  eventName: string,
  eventType: string,
  attendance: [
    { memberId: string, status: AttendanceStatus }
  ]
}
```
Creates event, attendance records, updates points, logs history.

### POST /api/adjust-points
Body:
```typescript
{
  memberId: string,
  pointsChange: number,
  reason: string
}
```
Manually adjusts points and logs the change.

### GET /api/point-history
Query params: `memberId=<uuid>` (optional), `limit=100` (optional)
Returns point history with member and event names joined.

## Tech Stack Details

### Frontend
- **Next.js 14**: App Router, Server Components where possible
- **TypeScript**: Strict mode enabled
- **Chakra UI v2**: Component library with dark theme
- **Framer Motion**: Animations for leaderboard
- **React Icons**: Icon library

### Backend
- **Next.js API Routes**: Serverless functions
- **Supabase**: PostgreSQL with real-time subscriptions
- **Row Level Security**: Secure data access

### Deployment
- **Vercel**: Automatic deployments from Git
- **Environment Variables**: Configured in Vercel dashboard

## Development Workflow

### Local Development
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

### Building
```bash
npm run build
npm start
```

### Deployment
Push to main branch → Vercel auto-deploys

## Common Modifications

### Adding New Event Types
Edit `lib/pointRules.ts`:
```typescript
export const POINT_RULES = {
  'New Event Type': {
    absent: -4,
    excused_absent: -1,
    // ... other statuses
  },
};
```

### Changing Admin Password
Update `ADMIN_PASSWORD` in environment variables.

### Adding New Members
Insert directly in Supabase or create an admin UI feature.

### Modifying UI Theme
Edit `lib/theme.ts` to change colors, fonts, etc.

## Important Notes

1. **Real-time Updates**: The leaderboard uses Supabase realtime subscriptions. Changes reflect immediately without page refresh.

2. **Service Role Key**: Admin operations use the service role key to bypass RLS. Keep this secure.

3. **No User Authentication**: Uses simple password auth. For multiple admins with different permissions, implement proper auth (Supabase Auth, etc.).

4. **Starting Points**: All members start with 100 points. Goal is to stay above 80.

5. **Inactive Members**: When marked inactive, they disappear from public leaderboard but remain in database.

## Future Enhancements

Potential features to add:
- Member profile pages
- Points history per member on public page
- Notifications when points change
- Email/SMS alerts for low points
- Admin user management
- Event templates and recurring events
- Data analytics and charts
- Mobile app version
- Member self-service portal

## Maintenance

- **Database Backups**: Supabase handles automatic backups
- **Monitoring**: Check Vercel analytics and Supabase usage
- **Costs**: Free tiers sufficient for small fraternity (~50 members)
- **Updates**: Keep dependencies updated periodically

## Support

For issues or questions:
1. Check QUICK_START.md for setup help
2. Check DEPLOYMENT.md for deployment issues
3. Check README.md for full documentation
4. Consult Next.js and Supabase docs

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
