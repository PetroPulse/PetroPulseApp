
# PetroPulse — Founder Setup (No Terminal)

You can launch PetroPulse without touching the command line.

## 1) Supabase (5 minutes)
- Create a free project at https://supabase.com
- Enable **Auth → Email** (magic link)
- Open **SQL Editor**, paste everything from `supabase-seed.sql`, and run it
- In **Project Settings → API**, copy your **Project URL** and **anon key**

## 2) Put this code on GitHub
- Go to GitHub → **New repository** → name it `petropulse`
- Click **Add file → Upload files** and drag this entire folder
- **Commit changes**

## 3) Deploy on Vercel
- Go to https://vercel.com → **New Project → Import petropulse**
- Add Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
- Click **Deploy** → open your URL

## 4) Try it
- Visit `/login` → enter your email → click magic link
- You’ll go to **/onboarding** to create your organization and set targets
- Visit **/dashboard** and **/orders** (import CSV into `orders` table to see data)

## 5) Import data
- Export invoices to CSV
- Add a column `org_id` with your org UUID (see Supabase → organizations table)
- Supabase → **Table Editor → orders → Import data**

## Next: AI Insights & QuickBooks
Ask me for the paste-ready AI routes and QuickBooks connector when you’re ready.
