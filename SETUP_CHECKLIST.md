# Setup Checklist

Follow this checklist to get your AI Image Editor up and running:

## ☑️ Prerequisites

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] n8n instance running (optional for testing)

## ☑️ Supabase Configuration

- [ ] Create new Supabase project
- [ ] Copy Project URL to `.env.local`
- [ ] Copy Anon Key to `.env.local`
- [ ] Copy Service Role Key to `.env.local`
- [ ] Copy Database URL to `.env.local`
- [ ] Create `temp-images` storage bucket (public)
- [ ] Enable Email authentication

## ☑️ Local Setup

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all environment variables
- [ ] Run `npm install`
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Run `npx prisma db seed`
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000

## ☑️ Test the Application

- [ ] Sign up with a new account
- [ ] Check email for verification (if required)
- [ ] Log in successfully
- [ ] Upload test images
- [ ] Select a preset or write custom prompt
- [ ] Submit job
- [ ] View job in dashboard
- [ ] Check job detail page

## ☑️ n8n Webhook (Optional)

- [ ] Set up n8n workflow
- [ ] Configure webhook endpoint
- [ ] Update N8N_WEBHOOK_URL in `.env.local`
- [ ] Test complete flow with actual image processing
- [ ] Verify callback receives results correctly

## ☑️ Production Deployment

- [ ] Push code to GitHub
- [ ] Create Vercel project
- [ ] Add all environment variables
- [ ] Update NEXT_PUBLIC_APP_URL
- [ ] Deploy
- [ ] Add Vercel domain to Supabase Auth redirect URLs
- [ ] Test production deployment
- [ ] Update n8n callback URL to production domain

## 🎉 You're Done!

Your AI Image Editor is now ready to use!

## Need Help?

Check the [README.md](README.md) for detailed instructions and troubleshooting.
