# Quick Start Guide - SEP Point System

## 🚀 Getting Started in 5 Minutes

### Step 1: Setup Database (2 minutes)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/mxhswvqdxjqzrkjtyrpf

2. Click **"SQL Editor"** in the left sidebar

3. Open the `supabase-schema.sql` file from this project

4. Copy and paste the entire SQL code into the editor

5. Click **"Run"** to create tables and insert members

✅ Done! Your database is ready with all 32 members starting at 100 points.

---

### Step 2: Test Locally (1 minute)

Your environment variables are already configured in `.env.local`!

```bash
# Install dependencies (if not already done)
npm install

# Run the development server
npm run dev
```

Visit:
- **Public Leaderboard**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin (password: SEP2025)

---

### Step 3: Deploy to Vercel (2 minutes)

**Option A: Via Vercel Website (Easiest)**

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. Go to https://vercel.com and click **"Add New Project"**

3. Import your GitHub repository

4. In **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mxhswvqdxjqzrkjtyrpf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aHN3dnFkeGpxenJranR5cnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDI2MDcsImV4cCI6MjA3ODQ3ODYwN30.0uexFoeXNy6egO8J-2IryFxjex8KmQoeuyhIGbxYy80
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aHN3dnFkeGpxenJranR5cnBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkwMjYwNywiZXhwIjoyMDc4NDc4NjA3fQ.F8GswIXjtuIdfUM5qGljxWJkmRHqzvsB_2ZYKYBTW6E
   ADMIN_PASSWORD=SEP2025
   ```

5. Click **"Deploy"**

6. Wait ~2 minutes and your site is live!

**Option B: Via Vercel CLI**

```bash
npm i -g vercel
vercel login
vercel --prod
```

Follow the prompts and add environment variables when asked.

---

## 📱 Using the System

### Public Leaderboard (Everyone Can Access)

- Shows all **active** members ranked by points
- Updates in **real-time** when points change
- Beautiful animations and modern UI
- Members below 80 points are marked "At Risk"

### Admin Dashboard (Password Protected)

**Password**: `SEP2025` (you can change this in environment variables)

**Tab 1: Attendance Tracker**
1. Enter event name (e.g., "Week 2")
2. Select event type (Active Meeting, Social Event, or Custom)
3. Mark each member's attendance status
4. Click "Submit Attendance" - points update automatically!

**Tab 2: Adjust Points**
1. Select a member
2. Enter positive or negative points to add/subtract
3. Provide a reason
4. Click to apply

**Tab 3: Point History**
- View all point changes
- Filter by member
- Search by keyword
- Export to CSV

---

## 🎯 Point System Rules

### Active Meeting
- **Present**: 0 points (no change)
- **Absent**: -5 points
- **Late**: -2 points
- **Excused Absent**: -1 point
- **Excused Late**: -1 point
- **INACTIVE**: No point change, status changed to inactive

### Social Event
- **Present**: 0 points
- **Absent**: -3 points
- **Late**: -1 point
- **Excused Absent**: -1 point
- **Excused Late**: 0 points

**Add more event types** by editing `lib/pointRules.ts`

---

## 🔧 Common Tasks

### Change Admin Password
Update `ADMIN_PASSWORD` in:
- `.env.local` (for local development)
- Vercel Dashboard → Settings → Environment Variables (for production)

### Add New Members
Currently, add them directly in Supabase:
1. Go to Supabase → Table Editor → members
2. Click "Insert row"
3. Fill in: name, points (default 100), status (active)

### Export All Data
Go to Admin Dashboard → Point History tab → Click "Export CSV"

### View Database
Go to: https://supabase.com/dashboard/project/mxhswvqdxjqzrkjtyrpf/editor

---

## 📞 Need Help?

Check these files in order:
1. `QUICK_START.md` (you are here)
2. `README.md` (detailed documentation)
3. `DEPLOYMENT.md` (deployment troubleshooting)

---

## ✨ Features at a Glance

- ✅ Real-time leaderboard updates
- ✅ Beautiful dark mode UI with animations
- ✅ Mobile responsive design
- ✅ Attendance tracking for all members
- ✅ Manual point adjustments with audit trail
- ✅ Complete point history log
- ✅ CSV export functionality
- ✅ Password-protected admin dashboard
- ✅ Automatic point calculations
- ✅ Rank change indicators (up/down arrows)

---

**You're all set! 🎉**

Visit your deployed site and start tracking points!
