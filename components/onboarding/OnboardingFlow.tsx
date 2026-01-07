'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building,
  Palette,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react'

interface OnboardingData {
  // Personal Info
  fullName: string
  industry: string
  businessType: string

  // Brand Preferences
  brandDescription: string
  targetAudience: string
  brandKeywords: string[]
  colorPreferences: string[]
  stylePreferences: string[]

  // Goals & Usage
  primaryGoals: string[]
  expectedUsage: string

  // Communication
  whatsappNumber?: string
  notificationsEmail: boolean
  notificationsWhatsApp: boolean
}

const industries = [
  'E-commerce', 'Fashion', 'Food & Beverage', 'Technology', 'Healthcare',
  'Real Estate', 'Education', 'Travel', 'Beauty & Cosmetics', 'Sports',
  'Automotive', 'Finance', 'Entertainment', 'Other'
]

const businessTypes = [
  'Small Business', 'Startup', 'Enterprise', 'Agency', 'Freelancer',
  'Non-profit', 'Personal Use'
]

const colorOptions = [
  'Vibrant', 'Muted', 'Monochromatic', 'Warm', 'Cool', 'Natural',
  'Bold', 'Pastel', 'Black & White', 'Colorful'
]

const styleOptions = [
  'Modern', 'Minimalist', 'Vintage', 'Professional', 'Creative',
  'Elegant', 'Playful', 'Bold', 'Natural', 'Artistic'
]

const goalOptions = [
  'Increase sales', 'Build brand awareness', 'Social media marketing',
  'Product showcasing', 'Website content', 'Email marketing',
  'Print materials', 'Content creation'
]

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    industry: '',
    businessType: '',
    brandDescription: '',
    targetAudience: '',
    brandKeywords: [],
    colorPreferences: [],
    stylePreferences: [],
    primaryGoals: [],
    expectedUsage: '',
    whatsappNumber: '',
    notificationsEmail: true,
    notificationsWhatsApp: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const router = useRouter()

  const steps = [
    { title: 'Welcome', description: 'Get started with Duma AI' },
    { title: 'Personal Info', description: 'Tell us about yourself' },
    { title: 'Brand Identity', description: 'Define your brand style' },
    { title: 'Goals & Usage', description: 'Set your objectives' },
    { title: 'Notifications', description: 'Stay connected' },
    { title: 'Complete', description: 'You\'re all set!' }
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const toggleArrayItem = (array: string[], item: string, field: keyof OnboardingData) => {
    const newArray = array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
    updateData({ [field]: newArray })
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !data.brandKeywords.includes(newKeyword.trim())) {
      updateData({
        brandKeywords: [...data.brandKeywords, newKeyword.trim()]
      })
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    updateData({
      brandKeywords: data.brandKeywords.filter(k => k !== keyword)
    })
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Personal Info
        return data.fullName && data.industry && data.businessType
      case 2: // Brand Identity
        return data.brandDescription && data.targetAudience
      case 3: // Goals & Usage
        return data.primaryGoals.length > 0 && data.expectedUsage
      case 4: // Notifications
        return true // Optional step
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      // Update user profile
      const profileResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          industry: data.industry,
          businessType: data.businessType,
          whatsappNumber: data.whatsappNumber,
          notificationsEmail: data.notificationsEmail,
          notificationsWhatsApp: data.notificationsWhatsApp,
          hasCompletedOnboarding: true
        })
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile')
      }

      // Create initial brand prompt
      if (data.brandDescription || data.brandKeywords.length > 0) {
        const brandPromptResponse = await fetch('/api/prompts/brand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Default Brand Style',
            prompt: generateBrandPrompt(),
            isDefault: true
          })
        })

        if (!brandPromptResponse.ok) {
          console.warn('Failed to create brand prompt, but continuing...')
        }
      }

      // Move to completion step
      setCurrentStep(steps.length - 1)
    } catch (error) {
      console.error('Onboarding error:', error)
      setError('Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateBrandPrompt = () => {
    const parts = []

    if (data.brandDescription) {
      parts.push(`Brand: ${data.brandDescription}`)
    }

    if (data.targetAudience) {
      parts.push(`Target audience: ${data.targetAudience}`)
    }

    if (data.brandKeywords.length > 0) {
      parts.push(`Keywords: ${data.brandKeywords.join(', ')}`)
    }

    if (data.colorPreferences.length > 0) {
      parts.push(`Colors: ${data.colorPreferences.join(', ')}`)
    }

    if (data.stylePreferences.length > 0) {
      parts.push(`Style: ${data.stylePreferences.join(', ')}`)
    }

    return parts.join('. ') + '. Create high-quality, professional images that align with this brand identity.'
  }

  const handleFinish = () => {
    router.push('/dashboard')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome to Duma AI!</h2>
              <p className="text-gray-600 text-lg">
                Let&apos;s set up your account and create your personalized brand style.
                This will only take a few minutes.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What you&apos;ll get:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Personalized brand prompts for consistent image style</li>
                <li>• Optimized settings based on your industry</li>
                <li>• Notification preferences for job updates</li>
                <li>• Access to all Duma AI features</li>
              </ul>
            </div>
          </div>
        )

      case 1: // Personal Info
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Building className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
              <p className="text-gray-600">This helps us customize your experience</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={data.fullName}
                  onChange={(e) => updateData({ fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select value={data.industry} onValueChange={(value) => updateData({ industry: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={data.businessType} onValueChange={(value) => updateData({ businessType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 2: // Brand Identity
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Palette className="w-12 h-12 mx-auto text-purple-600 mb-3" />
              <h2 className="text-2xl font-bold mb-2">Define your brand style</h2>
              <p className="text-gray-600">Help us understand your brand identity</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="brandDescription">Brand Description *</Label>
                <Textarea
                  id="brandDescription"
                  value={data.brandDescription}
                  onChange={(e) => updateData({ brandDescription: e.target.value })}
                  placeholder="Describe your brand, products, or services..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Input
                  id="targetAudience"
                  value={data.targetAudience}
                  onChange={(e) => updateData({ targetAudience: e.target.value })}
                  placeholder="Who are your customers? (e.g., young professionals, families)"
                />
              </div>

              <div>
                <Label>Brand Keywords</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add a keyword..."
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <Button onClick={addKeyword} variant="outline">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.brandKeywords.map(keyword => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeKeyword(keyword)}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Color Preferences</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {colorOptions.map(color => (
                    <label
                      key={color}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        data.colorPreferences.includes(color)
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox
                        checked={data.colorPreferences.includes(color)}
                        onCheckedChange={() => toggleArrayItem(data.colorPreferences, color, 'colorPreferences')}
                      />
                      <span className="text-sm">{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Style Preferences</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {styleOptions.map(style => (
                    <label
                      key={style}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        data.stylePreferences.includes(style)
                          ? 'bg-purple-50 border-purple-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox
                        checked={data.stylePreferences.includes(style)}
                        onCheckedChange={() => toggleArrayItem(data.stylePreferences, style, 'stylePreferences')}
                      />
                      <span className="text-sm">{style}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 3: // Goals & Usage
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Target className="w-12 h-12 mx-auto text-green-600 mb-3" />
              <h2 className="text-2xl font-bold mb-2">Goals & Usage</h2>
              <p className="text-gray-600">Help us understand how you&apos;ll use Duma AI</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Primary Goals *</Label>
                <p className="text-sm text-gray-600 mb-3">What do you want to achieve? (Select all that apply)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {goalOptions.map(goal => (
                    <label
                      key={goal}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        data.primaryGoals.includes(goal)
                          ? 'bg-green-50 border-green-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Checkbox
                        checked={data.primaryGoals.includes(goal)}
                        onCheckedChange={() => toggleArrayItem(data.primaryGoals, goal, 'primaryGoals')}
                      />
                      <span className="text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="expectedUsage">Expected Usage *</Label>
                <Select value={data.expectedUsage} onValueChange={(value) => updateData({ expectedUsage: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="How often will you use Duma AI?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="occasional">Occasionally</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 4: // Notifications
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Zap className="w-12 h-12 mx-auto text-yellow-600 mb-3" />
              <h2 className="text-2xl font-bold mb-2">Stay connected</h2>
              <p className="text-gray-600">Choose how you&apos;d like to receive updates</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={data.notificationsEmail}
                    onCheckedChange={(checked) => updateData({ notificationsEmail: !!checked })}
                  />
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-600">Get updates about your image processing jobs</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={data.notificationsWhatsApp}
                    onCheckedChange={(checked) => updateData({ notificationsWhatsApp: !!checked })}
                  />
                  <div>
                    <div className="font-medium">WhatsApp Notifications</div>
                    <div className="text-sm text-gray-600">Receive instant updates via WhatsApp</div>
                  </div>
                </label>
              </div>

              {data.notificationsWhatsApp && (
                <div>
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    value={data.whatsappNumber}
                    onChange={(e) => updateData({ whatsappNumber: e.target.value })}
                    placeholder="+234 xxx xxx xxxx"
                    type="tel"
                  />
                </div>
              )}
            </div>
          </div>
        )

      case 5: // Complete
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2 text-green-600">You&apos;re all set!</h2>
              <p className="text-gray-600 text-lg">
                Your account has been configured and your brand style has been created.
                You&apos;re ready to start creating amazing images with Duma AI!
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">What&apos;s next?</h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>• Visit your dashboard to start creating images</li>
                <li>• Check your brand prompts in the Prompts section</li>
                <li>• Explore your profile settings to fine-tune preferences</li>
                <li>• Start with our free credits to test your brand style</li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-2 text-sm text-gray-600">{steps[currentStep].description}</div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                onClick={handleBack}
                variant="outline"
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button onClick={handleFinish}>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : currentStep === 4 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}