# Deploy: going live

"What's Your Number?" builds to one self-contained `dist/index.html`. To run it
with a live shared leaderboard and lead capture, point it at a Supabase project.
With no keys it still runs, using the local demo backend.

## 1. Create the Supabase backend

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the project's **SQL Editor**, paste the entire contents of
   [`backend/supabase_schema.sql`](../backend/supabase_schema.sql), and run it once.
   This creates the `entries` and `leads` tables, the `SECURITY DEFINER` RPCs,
   and the grants. Row-level security is on and there are **no** direct table
   grants, so the only thing the browser can do is call the four functions.
3. In **Project Settings -> API**, copy the **Project URL** and the **anon public**
   key.
4. In the project root, copy `.env.example` to `.env` and fill both values:

   ```bash
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

   (Leaving either blank keeps the app on the local demo backend.)

## 2. Build

```bash
npm install
npm run build
```

The env values are read at build time and baked into the output. The result is a
single file: `dist/index.html` (JS, CSS, fonts and logo all inlined).

> Rebuild whenever you change the keys, the regional figures, or the booking URL,
> since everything is compiled into that one file.

## 3. Host it

Drop `dist/index.html` onto the host at **`kub.org/sb_game/`** (so it serves at
`https://kub.org/sb_game/`). It is fully self-contained, so no other assets,
build step, or server config are required. Open the URL on the kiosk to confirm.

## 4. How bankers read the leads

Leads are write-only from the browser; the client can never read an email back.
Read them from the **Supabase dashboard** (or any service-role export), not the
app. In **Table Editor -> `leads`**, or via the SQL Editor:

```sql
select created_at, name, email, country, target
from public.leads
where consent
order by created_at desc;
```

Only rows where the visitor ticked the consent box are returned by that query;
respect consent when exporting or contacting anyone.

## Security model (this is a bank)

- Two tables: `entries` (the leaderboard, no PII) and `leads` (emails, PII).
- RLS is enabled on both with no direct anon/auth table grants.
- The browser (anon key) can only **execute** the four `SECURITY DEFINER` RPCs:
  add itself to the room, read the top-N names + targets, fetch its standing, and
  write a lead. It can **never** read an email or list other people's leads.
- Email access is restricted to the dashboard / service role.
