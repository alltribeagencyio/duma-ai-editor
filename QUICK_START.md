# Quick Start Guide

Your credentials have been verified and are working! Follow these 3 simple steps to get your app running:

## ✅ Step 1: Create Database Tables (2 minutes)

1. Open your Supabase Dashboard: **https://hmtizgdzkueakwextuml.supabase.co**

2. Click **"SQL Editor"** in the left sidebar

3. Open the file `database-schema.sql` in this directory

4. Copy all the SQL and paste it into the Supabase SQL Editor

5. Click **"Run"** to create the tables

   You should see: ✅ Success. No rows returned

## ✅ Step 2: Seed the Database (30 seconds)

Back in your terminal, run:

```bash
npx prisma db seed
```

You should see: ✅ Seed data created successfully

## ✅ Step 3: Start the Application (10 seconds)

```bash
npm run dev
```

Then open: **http://localhost:3000**

---

## 🎉 That's It!

You should now see the login page. Create an account and start using the AI Image Editor!

### What You Can Do:

1. **Sign Up** - Create your account
2. **Upload Images** - Drag & drop up to 10 images
3. **Choose Style** - Select a preset or write custom prompts
4. **Track Jobs** - See all your editing jobs in the dashboard
5. **Download Results** - Download individual images or as ZIP

---

## 🐛 Troubleshooting

**Can't connect to Supabase?**
- Check that your Supabase project is active
- Verify the URL in `.env.local` matches your project

**Tables not creating?**
- Make sure you're logged into the correct Supabase project
- Check that you clicked "Run" in the SQL Editor

**Seed command fails?**
- Make sure you completed Step 1 first
- The PromptPreset table must exist before seeding

---

## 📝 Your Configuration

- **Supabase Project**: hmtizgdzkueakwextuml.supabase.co
- **n8n Webhook**: https://n8n.efortbrands.com
- **Local URL**: http://localhost:3000

All credentials are stored in `.env.local` and are working correctly!
