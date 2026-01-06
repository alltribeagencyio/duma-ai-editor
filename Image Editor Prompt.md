Complete Claude Code Prompt - Modern Minimal MVP
Copy and paste this entire prompt into Claude Code:

Build a complete AI image editing web app with user authentication, multi-step guided workflow, job tracking dashboard, and image results display. This is a production-ready MVP for internal validation with non-technical users.

DESIGN PHILOSOPHY - CRITICAL:
- Modern minimal aesthetic throughout
- Muted, professional color palette - NO bright or shouting colors
- Clean white/off-white backgrounds
- Subtle shadows and borders
- Generous spacing and breathing room
- Typography-focused design
- Professional, calm, trustworthy feel

COLOR PALETTE (Use these exclusively):
- Background: white (#ffffff) and gray-50 (#f9fafb)
- Text: gray-900 (#111827) for primary, gray-600 (#4b5563) for secondary
- Borders: gray-200 (#e5e7eb) and gray-300 (#d1d5db)
- Primary actions: gray-900 (#111827) with hover:gray-800
- Success: green-600 (#16a34a) - use sparingly
- Error: red-600 (#dc2626) - use sparingly
- Warning: amber-600 (#d97706) - use sparingly
- Info: blue-600 (#2563eb) - use sparingly
- Shadows: subtle gray shadows only

TECH STACK:
- Next.js 14 (App Router) with TypeScript
- Supabase (Auth + PostgreSQL + Storage)
- Prisma ORM
- Tailwind CSS + shadcn/ui
- React Dropzone
- JSZip + file-saver
- Zustand (state management)
- React Query (data fetching)

PROJECT SETUP:
1. Initialize Next.js project in current directory:
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - src/ directory: No
   - App Router: Yes
   - Default import alias: No

2. Install all dependencies:
```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install @prisma/client
   npm install -D prisma
   npm install zustand
   npm install @tanstack/react-query
   npm install react-dropzone
   npm install jszip file-saver
   npm install -D @types/file-saver
   npm install date-fns
   npm install lucide-react
```

3. Initialize shadcn/ui and add components:
```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add textarea
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add badge
   npx shadcn-ui@latest add toast
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add select
   npx shadcn-ui@latest add checkbox
   npx shadcn-ui@latest add separator
```

4. Initialize Prisma:
```bash
   npx prisma init
```

PROJECT STRUCTURE:
image-editor/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx (auth-specific layout)
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── new/page.tsx (multi-step form)
│   │   ├── jobs/[id]/page.tsx (job detail + results)
│   │   └── layout.tsx (includes sidebar)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── jobs/
│   │   │   ├── route.ts (POST - create job)
│   │   │   └── [id]/route.ts (GET - job details)
│   │   └── webhook/
│   │       └── callback/route.ts (POST - receive n8n results)
│   ├── layout.tsx (root layout)
│   └── page.tsx (landing/redirect)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── AuthGuard.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx (collapsible nav)
│   │   └── AppLayout.tsx
│   ├── new-edit/
│   │   ├── StepIndicator.tsx
│   │   ├── Step1Upload.tsx
│   │   ├── Step2Prompt.tsx
│   │   ├── Step3Review.tsx
│   │   └── MultiStepForm.tsx
│   ├── dashboard/
│   │   ├── JobCard.tsx
│   │   ├── JobList.tsx
│   │   └── EmptyState.tsx
│   ├── job-detail/
│   │   ├── JobHeader.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── ImageLightbox.tsx
│   │   └── DownloadActions.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── stores/
│   │   └── newEditStore.ts (Zustand)
│   ├── types.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── .env.local

ENVIRONMENT VARIABLES (.env.local):
Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
Database
DATABASE_URL=your_supabase_postgres_connection_string
n8n Webhook
N8N_WEBHOOK_URL=http://localhost:5678/webhook/image-edit
App
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE SCHEMA (prisma/schema.prisma):
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Job {
  id           String    @id @default(uuid())
  userId       String
  
  // Job Data
  status       String    @default("pending") // pending, processing, completed, failed
  prompt       String
  promptType   String    // "preset" or "custom"
  presetId     String?
  
  // Images
  inputImages  String[]
  outputData   Json?     // [{image: base64, driveLink: url, downloadUrl: url}]
  
  // Contact
  phone        String?
  notifyByEmail Boolean  @default(true)
  
  // Metadata
  createdAt      DateTime  @default(now())
  startedAt      DateTime?
  completedAt    DateTime?
  errorMessage   String?
  
  // Notification
  notificationSent Boolean @default(false)
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model PromptPreset {
  id          String  @id @default(uuid())
  name        String
  description String
  prompt      String
  category    String  // "background", "enhancement", "focus"
  icon        String  // lucide icon name
  order       Int
  isActive    Boolean @default(true)
  
  @@index([category])
  @@index([order])
}
```

SEED DATA (Create prisma/seed.ts):
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const presets = [
    {
      name: 'Remove Background',
      description: 'Clean product photo with transparent background',
      prompt: 'Remove the background completely, make it transparent',
      category: 'background',
      icon: 'Eraser',
      order: 1,
    },
    {
      name: 'White Background',
      description: 'Professional white background for e-commerce',
      prompt: 'Replace background with clean pure white',
      category: 'background',
      icon: 'Square',
      order: 2,
    },
    {
      name: 'Add Shadow',
      description: 'Natural shadow effect for depth',
      prompt: 'Add realistic subtle shadow beneath the product',
      category: 'enhancement',
      icon: 'Circle',
      order: 3,
    },
    {
      name: 'Enhance Colors',
      description: 'Vibrant, eye-catching product colors',
      prompt: 'Enhance and boost product colors while keeping it natural',
      category: 'enhancement',
      icon: 'Palette',
      order: 4,
    },
    {
      name: 'Product Focus',
      description: 'Sharp focus on product, blur background',
      prompt: 'Keep product sharp, add subtle background blur',
      category: 'focus',
      icon: 'Focus',
      order: 5,
    },
    {
      name: 'Lifestyle Setting',
      description: 'Place product in natural lifestyle context',
      prompt: 'Place product in a natural lifestyle setting',
      category: 'creative',
      icon: 'Home',
      order: 6,
    },
  ]

  for (const preset of presets) {
    await prisma.promptPreset.upsert({
      where: { name: preset.name },
      update: {},
      create: preset,
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Add to package.json:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

═══════════════════════════════════════════════════════════
DETAILED COMPONENT SPECIFICATIONS
═══════════════════════════════════════════════════════════

1. AUTHENTICATION COMPONENTS
═══════════════════════════════════════════════════════════

components/auth/LoginForm.tsx:
- Clean, centered card (max-w-md)
- Email input (type="email", required)
- Password input (type="password", required, min 8 chars)
- "Sign In" button (full width, gray-900 bg)
- Link to signup: "Don't have an account? Sign up"
- Error messages in subtle red text
- Loading state on button
- Form validation before submit

components/auth/SignupForm.tsx:
- Similar to LoginForm
- Additional: Confirm Password field
- Password requirements hint (min 8 chars)
- "Create Account" button
- Link to login: "Already have an account? Sign in"
- Success message: "Check your email to verify"

components/auth/AuthGuard.tsx:
- HOC or wrapper component
- Check Supabase auth session
- Redirect to /login if not authenticated
- Show loading skeleton while checking

Design for auth pages:
- Centered on page with generous margins
- Simple logo/title at top: "AI Image Editor"
- Subtle tagline: "Professional product photo editing"
- Form card with soft shadow
- Muted colors throughout
- Clean typography

═══════════════════════════════════════════════════════════

2. LAYOUT COMPONENTS
═══════════════════════════════════════════════════════════

components/layout/Sidebar.tsx:
Design (CRITICAL - Modern Minimal):
- Width: 280px (expanded), 80px (collapsed)
- Background: white with right border (gray-200)
- Position: fixed left side
- Smooth transition on collapse/expand (300ms ease)
- No bright colors anywhere

Structure:
- Top section:
  - App logo/name (gray-900 text)
  - Collapse/expand button (minimal hamburger icon)
  
- Navigation menu:
  - Dashboard (Home icon)
  - New Edit (Plus icon)
  - History (Clock icon)
  - Settings (Settings icon) - placeholder
  
  Each item:
  - Icon (gray-600) + text label
  - Hover: bg-gray-50
  - Active: bg-gray-100 + gray-900 text + left border (gray-900, 3px)
  - Padding: py-3 px-4
  - Gap between icon and text: 3
  - Rounded: rounded-lg
  - Margin: mx-2
  
- Bottom section:
  - Separator line (gray-200)
  - User info:
    - Avatar placeholder (gray-200 circle with initials)
    - Email (gray-600 text, truncate)
    - Logout button (text only, gray-600)
  - Collapse: show only avatar

Mobile (<768px):
- Overlay sidebar (slides in from left)
- Backdrop (bg-black/20)
- Close on outside click or menu item click

components/layout/AppLayout.tsx:
- Flex container
- Sidebar (fixed left)
- Main content area:
  - Margin-left: sidebar width
  - Padding: p-8
  - Background: gray-50
  - Min-height: 100vh

═══════════════════════════════════════════════════════════

3. MULTI-STEP FORM COMPONENTS
═══════════════════════════════════════════════════════════

components/new-edit/StepIndicator.tsx:
Design (Modern Minimal):
- Horizontal progress bar at top
- 3 steps layout:
  
  [1] ──────── [2] ──────── [3]
  Upload     Prompt      Review

- Each step:
  - Circle with number (40px diameter)
  - Step label below
  - Line connecting to next step
  
- States:
  - Completed: circle filled gray-900, checkmark icon, gray-400 text
  - Current: circle border gray-900 (2px), gray-900 text, number inside
  - Upcoming: circle border gray-300, gray-400 text, number inside
  - Connecting line: gray-300 (default), gray-900 (when completed)

- Layout:
  - Max-w-2xl mx-auto
  - Padding: py-8
  - Background: white
  - Border-bottom: gray-200

components/new-edit/Step1Upload.tsx:
Design:
- Dropzone area:
  - Border: 2px dashed gray-300
  - Border-radius: rounded-xl
  - Padding: p-12
  - Background: white
  - Hover: border-gray-400, bg-gray-50
  - Active drag: border-gray-900, bg-gray-100
  
- Center content:
  - Upload cloud icon (gray-400, size: 48px)
  - Text: "Drag images here or click to browse"
  - Subtext: "JPG, PNG, WEBP up to 5MB • Max 10 images"
  - Both in gray-600, center aligned

- Image previews (after upload):
  - Grid: grid-cols-2 md:grid-cols-4
  - Gap: gap-4
  - Each preview:
    - Aspect ratio: square
    - Rounded: rounded-lg
    - Border: gray-200
    - Relative positioning
    - Image: object-cover
    - Remove button (X):
      - Position: absolute top-2 right-2
      - Size: 24px circle
      - Background: white with shadow
      - Icon: gray-600
      - Hover: bg-gray-100

- Validation errors:
  - Below dropzone
  - Text: text-red-600 text-sm
  - Icon: alert circle

- "Next" button:
  - Position: bottom right
  - Background: gray-900
  - Text: white
  - Padding: px-6 py-3
  - Rounded: rounded-lg
  - Hover: bg-gray-800
  - Disabled: bg-gray-300, cursor-not-allowed

components/new-edit/Step2Prompt.tsx:
Design:
- Two sections with smooth toggle

Section 1: Preset Prompts (Default)
- Title: "Choose an editing style" (gray-900, text-xl, font-semibold)
- Subtitle: "Select from popular presets" (gray-600, text-sm)
- Grid of preset cards:
  - Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  - Gap: gap-4
  
  Each card:
  - Border: border gray-200
  - Rounded: rounded-lg
  - Padding: p-4
  - Background: white
  - Hover: border-gray-300, shadow-sm
  - Selected: border-gray-900 (2px), bg-gray-50
  - Cursor: pointer
  - Transition: all 300ms
  
  Card content:
  - Icon (gray-900, size: 24px)
  - Name (gray-900, font-medium)
  - Description (gray-600, text-sm)
  - Layout: flex column, gap-2

Section 2: Custom Prompt (Toggle)
- Toggle switch:
  - Label: "Use custom prompt instead"
  - Position: top right
  - Style: minimal switch (gray-200 → gray-900)
  
- When toggled:
  - Fade out preset grid
  - Fade in textarea:
    - Full width
    - Min-height: 120px
    - Border: gray-200
    - Rounded: rounded-lg
    - Padding: p-4
    - Focus: border-gray-400, ring-0
    - Placeholder: "Describe how you want your images edited..."
    
  - Character counter:
    - Below textarea
    - Text: gray-500, text-sm
    - Format: "0 / 500"
    - Turn red when >500

- Navigation:
  - "Back" button (left, ghost style, gray-600)
  - "Next" button (right, primary style)

components/new-edit/Step3Review.tsx:
Design:
- Card-based layout with sections

Section 1: Review Images
- Title: "Your Images" (gray-900, font-semibold)
- Grid of thumbnails (same as Step1)
- "Edit" button (ghost, gray-600) → goes back to Step 1

Section 2: Review Prompt
- Title: "Editing Instructions" (gray-900, font-semibold)
- Card with prompt text:
  - Background: gray-50
  - Padding: p-4
  - Rounded: rounded-lg
  - Text: gray-700
  - If preset: show preset name + icon
- "Edit" button → goes back to Step 2

Section 3: Notification (Optional)
- Title: "Get Notified" (gray-900, font-semibold)
- Checkbox: "Email me when editing is complete"
  - Checked by default
  - Email auto-filled from user auth
- Phone input (optional):
  - Label: "Phone (optional for SMS)"
  - Input: border gray-200
  - Hint: "Format: +1234567890"

Section 4: Submit
- Large button:
  - Text: "Submit for Editing"
  - Background: gray-900
  - Full width
  - Padding: py-4
  - Rounded: rounded-lg
  - Text: white, font-medium
  - Hover: bg-gray-800
  - Loading: spinner + "Submitting..."

- "Back" button above (ghost style)

components/new-edit/MultiStepForm.tsx:
- Container component managing state
- Zustand store for form data:
```typescript
  interface NewEditStore {
    step: 1 | 2 | 3
    images: File[]
    prompt: string
    promptType: 'preset' | 'custom'
    presetId: string | null
    phone: string
    notifyByEmail: boolean
    // actions
    setStep: (step: number) => void
    setImages: (images: File[]) => void
    // ... etc
  }
```
- Renders StepIndicator + current step component
- Handles navigation between steps
- Validates before allowing "Next"

═══════════════════════════════════════════════════════════

4. DASHBOARD COMPONENTS
═══════════════════════════════════════════════════════════

components/dashboard/JobCard.tsx:
Design (Modern Minimal Card):
- Container:
  - Background: white
  - Border: gray-200
  - Rounded: rounded-lg
  - Padding: p-4
  - Hover: shadow-sm, border-gray-300
  - Cursor: pointer
  - Transition: all 200ms

- Layout (horizontal flex):
  Left: Thumbnail (80x80px, rounded-lg, object-cover, gray-100 bg)
  Right: Content (flex-1, flex column, gap-2)
  
- Content structure:
  - Top row (flex justify-between):
    - Prompt preview (gray-900, font-medium, truncate)
    - Status badge (see StatusBadge below)
  
  - Middle:
    - Image count (gray-600, text-sm)
    - Format: "3 images"
  
  - Bottom row (flex justify-between):
    - Timestamp (gray-500, text-xs)
    - Format: "2 hours ago" using date-fns
    - View button (text-gray-600, text-sm, hover:text-gray-900)

components/dashboard/StatusBadge.tsx:
Design (Minimal badges):
- Pending: bg-gray-100, text-gray-700, "Pending"
- Processing: bg-blue-50, text-blue-700, "Processing"
- Completed: bg-green-50, text-green-700, "Completed"
- Failed: bg-red-50, text-red-700, "Failed"

- Style:
  - Padding: px-2.5 py-0.5
  - Rounded: rounded-full
  - Font: text-xs font-medium
  - No borders

components/dashboard/JobList.tsx:
- Title section:
  - "My Edits" (gray-900, text-2xl, font-bold)
  - "New Edit" button (right side, gray-900 bg, white text)

- Job list:
  - Stack of JobCard components
  - Gap: gap-3
  - Max width: max-w-4xl
  - Margin: mx-auto

- Loading state:
  - Skeleton cards (3-4)
  - Gray-200 animated pulse

- Empty state (see EmptyState)

- Pagination (if >20 jobs):
  - Simple "Load More" button
  - Or page numbers (1, 2, 3...)
  - Minimal style, gray-600 text

components/dashboard/EmptyState.tsx:
Design:
- Center aligned, py-20
- Icon: ImageOff or Upload (gray-300, size: 64px)
- Title: "No edits yet" (gray-900, text-xl)
- Description: "Start by uploading your first product images" (gray-600)
- "Create First Edit" button:
  - Background: gray-900
  - Text: white
  - Padding: px-6 py-3
  - Rounded: rounded-lg
  - Margin-top: 6

═══════════════════════════════════════════════════════════

5. JOB DETAIL COMPONENTS
═══════════════════════════════════════════════════════════

components/job-detail/JobHeader.tsx:
Design:
- Flex layout (space-between)
- Left side:
  - Back button ("← Back to Dashboard", gray-600, hover:gray-900)
  - Job title: Prompt text (gray-900, text-xl, font-semibold)
  - Metadata row:
    - Status badge
    - Timestamp
    - Image count
    - All separated by "•" (gray-400)

- Right side (if completed):
  - Download all button (see DownloadActions)

- Background: white
- Border-bottom: gray-200
- Padding: p-6

components/job-detail/ImageGallery.tsx:
Design (Modern Grid):
- Only shows if status = "completed"
- Loading skeleton if status = "processing"

- Grid layout:
  - Grid: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  - Gap: gap-4
  - Padding: p-6

- Each image card:
  - Aspect ratio: square
  - Rounded: rounded-lg
  - Border: gray-200
  - Overflow: hidden
  - Position: relative
  - Cursor: pointer (zoom on click)
  
- Image:
  - Object-fit: cover
  - Transition: transform 200ms
  - Hover: scale-105
  
- Overlay (on hover):
  - Background: bg-black/40
  - Fade in (opacity transition)
  - Center icons:
    - Zoom icon (white)
    - Download icon (white)
  - Icon size: 24px
  - Gap: 4

- Click behavior:
  - Opens ImageLightbox

components/job-detail/ImageLightbox.tsx:
Design (Full-screen modal):
- Backdrop: bg-black/90
- Position: fixed inset-0
- Z-index: 50

- Content:
  - Centered image
  - Max-width: 90vw
  - Max-height: 90vh
  - Object-fit: contain
  - Rounded: rounded-lg

- Controls:
  - Close button (top-right):
    - Icon: X
    - Color: white
    - Background: bg-white/10
    - Hover: bg-white/20
    - Size: 40px circle
  
  - Download button (bottom-right):
    - Text: "Download"
    - Background: white
    - Text: gray-900
    - Padding: px-4 py-2
    - Rounded: rounded-lg
    - Hover: bg-gray-100
  
  - Navigation (if multiple images):
    - Previous button (left): ←
    - Next button (right): →
    - Style: white/10 bg, white text, 48px circle
    - Position: absolute, centered vertically

- Keyboard support:
  - Escape: close
  - Arrow keys: navigate
  - Click outside: close

components/job-detail/DownloadActions.tsx:
Design:
- Flex row, gap-2

- Individual download:
  - Handled in ImageGallery hover/lightbox

- Download all button:
  - Text: "Download All"
  - Icon: Download
  - Background: gray-900
  - Text: white
  - Padding: px-4 py-2
  - Rounded: rounded-lg
  - Hover: bg-gray-800

- Download all as ZIP button:
  - Text: "Download ZIP"
  - Icon: FileArchive
  - Background: white
  - Border: gray-200
  - Text: gray-900
  - Padding: px-4 py-2
  - Rounded: rounded-lg
  - Hover: bg-gray-50

- Loading state:
  - Show spinner
  - Text: "Preparing..."
  - Disabled

Implementation:
```typescript
// Individual download (from base64)
const downloadImage = (base64: string, filename: string) => {
  const link = document.createElement('a')
  link.href = base64
  link.download = filename
  link.click()
}

// ZIP download
const downloadAllAsZip = async (results: Result[]) => {
  const zip = new JSZip()
  
  results.forEach((result, i) => {
    const arr = result.image.split(',')
    const bstr = atob(arr[1])
    const u8arr = new Uint8Array(bstr.length)
    
    for(let j = 0; j < bstr.length; j++) {
      u8arr[j] = bstr.charCodeAt(j)
    }
    
    zip.file(`edited-${i + 1}.jpg`, u8arr)
  })
  
  const content = await zip.generateAsync({type: 'blob'})
  saveAs(content, `edited-images-${Date.now()}.zip`)
}
```

═══════════════════════════════════════════════════════════

6. API ROUTES
═══════════════════════════════════════════════════════════

app/api/jobs/route.ts (POST):
```typescript
export async function POST(req: Request) {
  // 1. Verify auth
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  // 2. Parse form data
  const formData = await req.formData()
  const prompt = formData.get('prompt') as string
  const promptType = formData.get('promptType') as string
  const presetId = formData.get('presetId') as string | null
  const phone = formData.get('phone') as string | null
  const images = formData.getAll('images') as File[]
  
  // 3. Upload images to Supabase Storage
  const inputImageUrls = []
  for (let i = 0; i < images.length; i++) {
    const file = images[i]
    const fileName = `${user.id}/${Date.now()}-${i}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from('temp-images')
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('temp-images')
      .getPublicUrl(fileName)
    
    inputImageUrls.push(publicUrl)
  }
  
  // 4. Create job in database
  const job = await prisma.job.create({
    data: {
      userId: user.id,
      prompt,
      promptType,
      presetId,
      phone,
      inputImages: inputImageUrls,
      status: 'pending',
    },
  })
  
  // 5. Send webhook to n8n
  const webhookPayload = {
    jobId: job.id,
    userId: user.id,
    userEmail: user.email,
    imageUrls: inputImageUrls,
    prompt,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/callback`,
  }
  
  await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload),
  })
  
  // 6. Update job status to processing
  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'processing', startedAt: new Date() },
  })
  
  // 7. Return job
  return Response.json({ job }, { status: 201 })
}
```

app/api/jobs/[id]/route.ts (GET):
```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  const job = await prisma.job.findUnique({
    where: { id: params.id },
  })
  
  if (!job) return Response.json({ error: 'Not found' }, { status: 404 })
  if (job.userId !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })
  
  return Response.json({ job })
}
```

app/api/webhook/callback/route.ts (POST):
```typescript
export async function POST(req: Request) {
  const { jobId, status, results, errorMessage } = await req.json()
  
  // Update job
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status,
      outputData: results,
      completedAt: status === 'completed' ? new Date() : null,
      errorMessage: errorMessage || null,
    },
  })
  
  // TODO: Send email notification
  // if (status === 'completed') {
  //   await sendEmail(job.userId, jobId)
  // }
  
  return Response.json({ success: true })
}
```

═══════════════════════════════════════════════════════════

7. PAGES
═══════════════════════════════════════════════════════════

app/(auth)/login/page.tsx:
- Centered layout
- LoginForm component
- Minimal design
- White card on gray-50 background

app/(auth)/signup/page.tsx:
- Centered layout
- SignupForm component
- Similar to login

app/(app)/dashboard/page.tsx:
- AppLayout with sidebar
- JobList component
- Padding: p-8
- Background: gray-50

app/(app)/new/page.tsx:
- AppLayout with sidebar
- MultiStepForm component
- Max-width: max-w-4xl mx-auto
- Background: white card on gray-50

app/(app)/jobs/[id]/page.tsx:
- AppLayout with sidebar
- JobHeader component
- Job details section
- ImageGallery component (if completed)
- DownloadActions component

app/page.tsx:
- Root landing page
- If authenticated: redirect to /dashboard
- If not: redirect to /login

═══════════════════════════════════════════════════════════

8. GLOBAL STYLES & TYPOGRAPHY
═══════════════════════════════════════════════════════════

app/globals.css:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
  }
  
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  h1 {
    @apply text-3xl font-bold tracking-tight;
  }
  
  h2 {
    @apply text-2xl font-semibold tracking-tight;
  }
  
  h3 {
    @apply text-xl font-semibold;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f9fafb;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
```

═══════════════════════════════════════════════════════════

CRITICAL DESIGN REQUIREMENTS:
═══════════════════════════════════════════════════════════

1. COLOR USAGE:
   - Use ONLY the specified muted color palette
   - NO bright blues, greens, reds except for status indicators
   - Primary interactions: gray-900
   - Backgrounds: white and gray-50
   - Text: gray-900 (primary), gray-600 (secondary), gray-500 (tertiary)
   - Borders: gray-200 and gray-300
   - Shadows: use gray-based shadows only (shadow-sm, shadow)

2. SPACING:
   - Generous padding everywhere (p-6, p-8)
   - Large gaps between elements (gap-4, gap-6)
   - Comfortable line heights (leading-relaxed)
   - Breathing room in cards and containers

3. TYPOGRAPHY:
   - System fonts only (no custom fonts)
   - Clear hierarchy: text-2xl, text-xl, text-base, text-sm, text-xs
   - Font weights: font-normal (400), font-medium (500), font-semibold (600), font-bold (700)
   - Readable text colors (gray-900, not black)

4. INTERACTIVE ELEMENTS:
   - Subtle hover states (bg-gray-50, bg-gray-100)
   - Smooth transitions (transition-all duration-200)
   - Clear focus states (ring-2 ring-gray-400)
   - Disabled states: bg-gray-300, cursor-not-allowed

5. SHADOWS & DEPTH:
   - Minimal shadows (shadow-sm for cards)
   - Borders preferred over shadows
   - No drop-shadows or heavy shadows
   - Elevation through borders, not shadows

6. BORDERS & CORNERS:
   - Rounded corners: rounded-lg (8px) or rounded-xl (12px)
   - Consistent border widths: 1px default
   - Border colors: gray-200 (light), gray-300 (medium)

7. ICONS:
   - Use lucide-react icons exclusively
   - Icon sizes: 16px (sm), 20px (default), 24px (lg)
   - Icon colors: gray-600 (default), gray-900 (active)
   - Consistent icon usage throughout

8. LOADING STATES:
   - Skeleton loaders (gray-200 background, pulse animation)
   - Spinners: gray-900 with opacity
   - No bright loading indicators

9. FORMS:
   - Input height: py-2 (comfortable)
   - Input borders: border-gray-200
   - Focus: border-gray-400, ring-0 (no blue ring)
   - Labels: text-sm, text-gray-700, font-medium
   - Placeholders: text-gray-400

10. RESPONSIVE:
    - Mobile-first approach
    - Breakpoints: sm (640px), md (768px), lg (1024px)
    - Touch-friendly (min 44px tap targets on mobile)
    - Sidebar collapses on mobile

═══════════════════════════════════════════════════════════

TESTING CHECKLIST:
═══════════════════════════════════════════════════════════

After building, ensure:
- [ ] User can sign up with email
- [ ] User receives verification email
- [ ] User can log in
- [ ] User is redirected to dashboard when authenticated
- [ ] User is redirected to login when not authenticated
- [ ] Sidebar navigation works
- [ ] Sidebar collapses/expands
- [ ] Multi-step form navigation works
- [ ] Can upload multiple images
- [ ] Image previews show correctly
- [ ] Can remove individual images
- [ ] Preset prompts display correctly
- [ ] Can toggle to custom prompt
- [ ] Character counter works
- [ ] Review step shows all data correctly
- [ ] Can go back and edit previous steps
- [ ] Submit creates job in database
- [ ] Webhook sends to n8n
- [ ] User is redirected to dashboard after submit
- [ ] Dashboard shows new job with "pending" status
- [ ] Job card displays correctly
- [ ] Can click job to view details
- [ ] Job detail page shows all info
- [ ] When job completes, images display in gallery
- [ ] Can click image to view in lightbox
- [ ] Lightbox navigation works
- [ ] Can download individual images
- [ ] Can download all as ZIP
- [ ] Status updates reflect in UI
- [ ] Mobile responsive works
- [ ] All colors are muted (no bright colors)
- [ ] Design looks modern and minimal

═══════════════════════════════════════════════════════════

DEPLOYMENT NOTES:
═══════════════════════════════════════════════════════════

1. Set up Supabase project:
   - Create new project
   - Copy connection strings and keys to .env.local
   - Create storage bucket: "temp-images" (public)
   - Enable Email Auth

2. Run database migration:
```bash
   npx prisma migrate dev --name init
   npx prisma db seed
```

3. Test locally:
```bash
   npm run dev
```

4. Deploy to Vercel:
   - Push to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy

═══════════════════════════════════════════════════════════

Build this complete application following all specifications exactly. Pay special attention to the modern minimal design with muted colors - NO bright or shouting colors anywhere. The app should feel calm, professional, and trustworthy.