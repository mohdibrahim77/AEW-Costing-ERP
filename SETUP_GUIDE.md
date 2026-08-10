# AEW Platform — Supabase Setup Guide

This guide takes you from zero to a fully secure login system in about 20 minutes.
After this, no passwords will ever appear in your source code.

---

## Why Supabase

- PostgreSQL database (industry standard, used by Spotify, GitHub, etc.)
- Built-in user management with bcrypt password hashing
- JWT authentication tokens built in
- Free tier covers hundreds of users
- Row Level Security — each factory can only see their own data
- Dashboard to manage users without touching code
- When you add Vibration AI in Python, it connects to the same database

---

## Step 1 — Create Your Supabase Account

1. Go to **supabase.com**
2. Click **Start your project**
3. Sign up with GitHub (recommended) or email
4. Click **New project**
5. Fill in:
   - **Name**: aew-platform
   - **Database Password**: Generate a strong one and SAVE IT SOMEWHERE SAFE
   - **Region**: Southeast Asia (Singapore) — closest to Bangalore
6. Click **Create new project**
7. Wait ~2 minutes for the project to provision

---

## Step 2 — Get Your API Keys

1. In your Supabase project, click **Settings** (gear icon, bottom left)
2. Click **API**
3. You will see two keys:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — starts with `eyJhbGci...`

These are the two values you paste into `login.html`.

> **Important**: The anon key is SAFE to put in client-side code. It is designed to be public.
> It only has permission to do what Supabase Row Level Security allows.
> NEVER put the `service_role` key in client code — that one is private and has admin access.

---

## Step 3 — Update login.html

Open `login.html` in VS Code.

Find these two lines near the top of the `<script type="module">` block:

```javascript
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace them with your actual values:

```javascript
const SUPABASE_URL      = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...your_actual_key...';
```

Save the file. The setup warning on the login page will disappear automatically.

---

## Step 4 — Create Your First User (HISPL)

1. In Supabase dashboard, click **Authentication** (left sidebar)
2. Click **Users**
3. Click **Invite user** (top right)
4. Enter HISPL's email: e.g., `admin@hispl.com`
5. Supabase sends them an email to set their own password

OR to create a user with a password yourself:

1. Click **Add user** → **Create new user**
2. Enter email and a temporary password
3. The user must change it on first login (you can configure this)

**Set user metadata** (what products they can access):

1. Click on the user you just created
2. Click **Edit**
3. In **Raw User Meta Data**, paste:

```json
{
  "name": "Aniktha Patirat",
  "company": "Hydraulics India Services Pvt. Ltd.",
  "role": "admin",
  "products": ["costing"],
  "avatar": "A"
}
```

4. Click **Save**

When this user logs in, they will be redirected to `products/costing/index.html` automatically.

---

## Step 5 — Deploy to Cloudflare Pages

1. In VS Code, press `Ctrl + Shift + G` (Source Control)
2. Stage all changed files
3. Commit message: `Add Supabase secure authentication`
4. Push to GitHub
5. Cloudflare Pages deploys automatically within 60 seconds

---

## Adding More Customers

For every new factory that signs up:

1. Supabase Dashboard → Authentication → Users → Invite user
2. Enter their email
3. Set their `user_metadata`:

```json
{
  "name": "Factory Owner Name",
  "company": "Factory Name Pvt. Ltd.",
  "role": "admin",
  "products": ["costing"],
  "avatar": "F"
}
```

That is it. No code changes needed. No redeployment needed.

---

## Product Keys Reference

When a customer should have access to multiple products:

```json
{
  "products": ["costing", "cbam"]
}
```

Available product keys → routes in `login.html`:
| Key         | Redirects to                        |
|-------------|-------------------------------------|
| `costing`   | `products/costing/index.html`       |
| `cbam`      | `products/cbam/index.html`          |
| `vibration` | `products/vibration/index.html`     |
| `dashboard` | `dashboard.html`                    |

Admins (`"role": "admin"`) always go to `dashboard.html` regardless of products.

---

## Adding a Database (Next Step)

When you want to save quotations permanently:

1. Supabase Dashboard → **Table Editor** → **New table**
2. Table name: `quotations`
3. Columns:
   - `id` (uuid, primary key, auto-generated)
   - `user_id` (uuid, foreign key → auth.users)
   - `inquiry_no` (text)
   - `customer` (text)
   - `bore` (numeric)
   - `rod` (numeric)
   - `stroke` (numeric)
   - `total_cost` (numeric)
   - `selling_price` (numeric)
   - `data` (jsonb — stores the full costing as JSON)
   - `created_at` (timestamptz, default now())

4. Enable Row Level Security → Add policy: `user_id = auth.uid()` (users only see their own records)

In the ERP tool, after generating a quotation, call:

```javascript
const { data, error } = await supabase
  .from('quotations')
  .insert({
    user_id: session.user.id,
    inquiry_no: document.getElementById('inq-no').value,
    customer: document.getElementById('inq-cust').value,
    bore: gv('inq-bore'),
    rod: gv('inq-rod'),
    stroke: gv('inq-stroke'),
    total_cost: currentMfgCost,
    selling_price: currentSellingPrice,
    data: JSON.stringify(fullCostingData)
  });
```

Every quotation ever generated is now saved permanently and searchable.

---

## Architecture Summary

```
User types email + password
        ↓ HTTPS (encrypted)
Supabase Auth Servers
        ↓ bcrypt comparison against stored hash
        ↓ Returns JWT token (not password)
Your Frontend
        ↓ Sends JWT on every database request
Supabase PostgreSQL
        ↓ Row Level Security validates JWT
        ↓ Returns only this user's data
Your Frontend
```

**What is never visible in source code:**
- Passwords (hashed with bcrypt, stored in Supabase)
- Other users' data (Row Level Security blocks it)
- Admin database credentials (SERVICE_ROLE key stays on server only)

**What IS visible in source code (and that is fine):**
- `SUPABASE_URL` — just an address, useless without auth
- `SUPABASE_ANON_KEY` — public by design, only has what RLS permits

---

*Built by AEW · Bangalore, India*
