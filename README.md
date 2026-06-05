# Duma AI Image Editor - Complete Setup Guide

A modern, production-ready AI image editing web application by Duma AI with user authentication, multi-step workflow, and job tracking.

## ✨ Features

- 🔐 User authentication with Supabase
- 📸 Multi-image upload with drag & drop
- 🎨 Preset and custom prompts for image editing
- 📊 Job tracking dashboard
- 🖼️ Image gallery with lightbox
- 📦 Bulk download with ZIP support
- 📱 Fully responsive design
- 🎯 Modern minimal aesthetic (muted color palette)
- 

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Supabase Auth
- **Database**: PostgreSQL (via Supabase), Prisma ORM
- **State Management**: Zustand
- **Data Fetching**: React Query
- **File Handling**: React Dropzone, JSZip
- **Storage**: Supabase Storage

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account
- n8n instance (for image processing webhook)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd "Nano Banana Pro Image Editor"
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials:
   - Project URL
   - Anon/Public Key
   - Service Role Key (Settings → API)
   - Database Connection String (Settings → Database)

3. Create a storage bucket:
   - Go to Storage in Supabase dashboard
   - Create a new public bucket named `temp-images`
   - Set it to public access

4. Enable Email Auth:
   - Go to Authentication → Providers
   - Enable Email provider
   - Configure email templates if desired

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (from Supabase Settings → Database → Connection String)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres

# n8n Webhook
N8N_WEBHOOK_URL=http://localhost:5678/webhook/image-edit

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Database

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

Seed the database with preset prompts:

```bash
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/               # Protected app pages
│   │   ├── dashboard/
│   │   ├── new/
│   │   └── jobs/[id]/
│   └── api/                 # API routes
│       ├── jobs/
│       ├── presets/
│       └── webhook/
├── components/
│   ├── auth/                # Authentication components
│   ├── layout/              # Layout components (Sidebar, AppLayout)
│   ├── new-edit/            # Multi-step form components
│   ├── dashboard/           # Dashboard components
│   ├── job-detail/          # Job detail & gallery components
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── supabase/            # Supabase client utilities
│   ├── stores/              # Zustand stores
│   ├── types.ts             # TypeScript types
│   ├── utils.ts             # Utility functions
│   └── prisma.ts            # Prisma client
└── prisma/
    ├── schema.prisma        # Database schema
    └── seed.ts              # Seed data
```

## 🔌 n8n Webhook Integration

The app sends image editing jobs to an n8n workflow via webhook. Your n8n workflow should:

1. Receive the webhook with this payload:
```json
{
  "jobId": "uuid",
  "userId": "uuid",
  "userEmail": "user@example.com",
  "imageUrls": ["url1", "url2"],
  "prompt": "editing instructions",
  "callbackUrl": "https://your-app.com/api/webhook/callback"
}
```

2. Process the images (using AI image editing service)

3. Send results back to the callback URL:
```json
{
  "jobId": "uuid",
  "status": "completed",
  "results": [
    {
      "image": "data:image/jpeg;base64,...",
      "driveLink": "optional-google-drive-link",
      "downloadUrl": "optional-direct-download-url"
    }
  ]
}
```

For failed jobs:
```json
{
  "jobId": "uuid",
  "status": "failed",
  "errorMessage": "Error description"
}
```

## 🎨 Design Philosophy

This app follows a **modern minimal** design aesthetic:

- **Muted color palette**: Grays, whites, subtle shadows
- **No bright colors**: Status indicators use muted tones
- **Generous spacing**: Comfortable padding and gaps
- **Typography-focused**: Clear hierarchy with system fonts
- **Subtle interactions**: Smooth transitions, minimal effects
- **Professional feel**: Calm, trustworthy, clean

## 📝 Database Schema

### Job
- Stores image editing jobs
- Tracks status (pending → processing → completed/failed)
- Stores input image URLs and output results
- Supports email/SMS notifications

### PromptPreset
- Predefined editing prompts
- Categorized (background, enhancement, focus, creative)
- Ordered display with icons

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import project to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. Add environment variables in Vercel dashboard:
   - Add all variables from `.env.local`
   - Make sure `NEXT_PUBLIC_APP_URL` points to your Vercel domain

4. Deploy!

### Post-Deployment

1. Update Supabase Auth Settings:
   - Add your Vercel domain to allowed redirect URLs
   - Update email templates if needed

2. Update n8n webhook callback URL to point to your production domain

3. Test the complete flow:
   - Sign up / Sign in
   - Upload images
   - Submit job
   - Check job status
   - Download results

## 🔒 Security Notes

- Environment variables are properly separated (public vs server-only)
- Middleware handles authentication redirects
- API routes verify user authentication
- File uploads are validated (type, size)
- User can only access their own jobs

## 🐛 Troubleshooting

### Images not uploading
- Check Supabase storage bucket exists and is public
- Verify NEXT_PUBLIC_SUPABASE_URL and keys are correct

### Authentication not working
- Verify Supabase credentials
- Check that email provider is enabled in Supabase
- Check middleware configuration

### Database errors
- Run `npx prisma generate` to regenerate client
- Run `npx prisma db push` to sync schema
- Check DATABASE_URL is correct

### n8n webhook not working
- Verify N8N_WEBHOOK_URL is accessible
- Check webhook payload format
- Test callback URL is publicly accessible

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [n8n Documentation](https://docs.n8n.io)

## 📄 License

This project is for internal use.

---

Built with ❤️ by **Duma AI** using Next.js, Supabase, and Prisma
