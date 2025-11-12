# Deployment Guide - SEP Point System

## Step 1: Setup Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/mxhswvqdxjqzrkjtyrpf

2. Click on "SQL Editor" in the left sidebar

3. Open the file `supabase-schema.sql` from your project

4. Copy the entire contents and paste it into the SQL Editor

5. Click "Run" to execute the SQL and create all tables

6. Verify tables were created:
   - Go to "Table Editor" in sidebar
   - You should see: `members`, `events`, `attendance_records`, `point_history`

7. Check that members were inserted:
   - Click on the `members` table
   - You should see ~32 members all starting with 100 points

## Step 2: Deploy to Vercel

### Method 1: Via GitHub (Recommended)

1. **Initialize Git and push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit - SEP Point System"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/SEP-Point-System.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Add Environment Variables:**
   - In your Vercel project dashboard, go to "Settings" → "Environment Variables"
   - Add these variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://mxhswvqdxjqzrkjtyrpf.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aHN3dnFkeGpxenJranR5cnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDI2MDcsImV4cCI6MjA3ODQ3ODYwN30.0uexFoeXNy6egO8J-2IryFxjex8KmQoeuyhIGbxYy80
     SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aHN3dnFkeGpxenJranR5cnBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkwMjYwNywiZXhwIjoyMDc4NDc4NjA3fQ.F8GswIXjtuIdfUM5qGljxWJkmRHqzvsB_2ZYKYBTW6E
     ADMIN_PASSWORD = SEP2025
     ```
   - Make sure to add them for "Production", "Preview", and "Development" environments

4. **Redeploy:**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment

### Method 2: Via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project or create new? → Create new
   - What's your project's name? → sep-point-system
   - In which directory is your code located? → ./
   - Want to override settings? → No

5. **Add environment variables:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add ADMIN_PASSWORD
   ```

6. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Step 3: Test Your Deployment

1. **Test Public Leaderboard:**
   - Visit your Vercel URL (e.g., https://sep-point-system.vercel.app)
   - You should see the leaderboard with all active members
   - Verify animations and styling work correctly

2. **Test Admin Dashboard:**
   - Go to https://your-domain.vercel.app/admin
   - Login with password: SEP2025
   - Test each tab:
     - **Attendance Tracker**: Try marking attendance for a test event
     - **Adjust Points**: Try adding/subtracting points from a member
     - **Point History**: Verify your changes appear in the log

3. **Test Real-time Updates:**
   - Open the leaderboard in one browser tab
   - Open the admin dashboard in another tab
   - Make a point change in the admin dashboard
   - Verify the leaderboard updates automatically without refreshing

## Step 4: Share with Your Frat

1. **Get your URLs:**
   - Public Leaderboard: `https://your-domain.vercel.app`
   - Admin Dashboard: `https://your-domain.vercel.app/admin`

2. **Share the public URL** with all members

3. **Keep the admin password secure** - only share with authorized admins

4. **Optional - Custom Domain:**
   - Go to Vercel project settings → "Domains"
   - Add your custom domain (e.g., seppoints.com)
   - Follow Vercel's instructions to configure DNS

## Troubleshooting

### Issue: "Failed to load members"
- **Solution**: Check that your Supabase environment variables are correct in Vercel
- Verify the SQL schema was run successfully in Supabase

### Issue: "Authentication failed" on admin page
- **Solution**: Check that ADMIN_PASSWORD is set correctly in Vercel environment variables
- Default password is "SEP2025"

### Issue: Real-time updates not working
- **Solution**: Check that Row Level Security policies are set correctly in Supabase
- Verify the public read policies exist for `members` and `point_history` tables

### Issue: Points not updating after attendance submission
- **Solution**: Check browser console for errors
- Verify SUPABASE_SERVICE_ROLE_KEY is set in Vercel (needed for write operations)

## Updating the App

When you make changes to your code:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Vercel will automatically redeploy** (if connected to GitHub)

OR use Vercel CLI:
```bash
vercel --prod
```

## Security Notes

- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Keep your Supabase service role key secure
- Change the default admin password
- Consider implementing proper authentication for multiple admins
- Monitor your Supabase usage to stay within free tier limits

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
