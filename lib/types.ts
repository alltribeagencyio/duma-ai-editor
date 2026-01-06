export interface Job {
  id: string
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  prompt: string
  promptType: 'preset' | 'custom'
  presetId: string | null
  productName: string | null
  productCategory: string | null
  productSku: string | null
  inputImages: string[]
  outputData: OutputResult[] | null
  phone: string | null
  notifyByEmail: boolean
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  errorMessage: string | null
  notificationSent: boolean
}

export interface OutputResult {
  image: string // base64
  driveLink?: string
  downloadUrl?: string
}

export interface PromptPreset {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  icon: string
  order: number
  isActive: boolean
}

export interface NewEditFormData {
  step: 1 | 2 | 3
  images: File[]
  prompt: string
  promptType: 'preset' | 'custom'
  presetId: string | null
  phone: string
  notifyByEmail: boolean
}
