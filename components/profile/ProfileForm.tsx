'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PhoneInput } from '@/components/ui/phone-input'

interface UserProfile {
  id: string
  email: string
  fullName?: string
  phone?: string
  phoneCountryCode?: string
  brandName?: string
  brandIndustry?: string
  brandAesthetic?: string
  brandColors?: string[]
  brandRequirements?: string
  subscriptionTier: string
  monthlyCredits: number
  practiceCredits: number
  creditsUsed: number
  notificationsEmail: boolean
  notificationsWhatsApp: boolean
  whatsappNumber?: string
  language: string
  timezone: string
}

interface ProfileFormProps {
  profile: UserProfile
  onUpdate: (data: Partial<UserProfile>) => Promise<void>
  isSaving: boolean
  pricingPlan: string
}

export function ProfileForm({ profile, onUpdate, isSaving, pricingPlan }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    phoneCountryCode: profile.phoneCountryCode || '+254',
    brandName: profile.brandName || '',
    brandIndustry: profile.brandIndustry || '',
    brandAesthetic: profile.brandAesthetic || '',
    brandColors: profile.brandColors || [],
    brandRequirements: profile.brandRequirements || '',
    notificationsEmail: profile.notificationsEmail,
    notificationsWhatsApp: profile.notificationsWhatsApp,
    whatsappNumber: profile.whatsappNumber || '',
    language: profile.language,
    timezone: profile.timezone,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...formData.brandColors]
    newColors[index] = color
    setFormData(prev => ({ ...prev, brandColors: newColors }))
  }

  const addColor = () => {
    if (formData.brandColors.length < 5) {
      setFormData(prev => ({
        ...prev,
        brandColors: [...prev.brandColors, '#000000']
      }))
    }
  }

  const removeColor = (index: number) => {
    const newColors = formData.brandColors.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, brandColors: newColors }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onUpdate(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information and brand preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <PhoneInput
                  countryCode={formData.phoneCountryCode}
                  phoneNumber={formData.phone}
                  onCountryCodeChange={(code) => handleInputChange('phoneCountryCode', code)}
                  onPhoneNumberChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="123 456 7890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                value={profile.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>

          {/* Brand Information - Only for Business Plan */}
          {pricingPlan === 'business' && (
            <>
              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Brand Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Brand Name
                </label>
                <Input
                  value={formData.brandName}
                  onChange={(e) => handleInputChange('brandName', e.target.value)}
                  placeholder="Your brand or company name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Industry
                </label>
                <Select
                  value={formData.brandIndustry}
                  onValueChange={(value) => handleInputChange('brandIndustry', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                    <SelectItem value="beauty">Beauty & Cosmetics</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="jewelry">Jewelry</SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="sports">Sports & Fitness</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Brand Aesthetic
              </label>
              <Select
                value={formData.brandAesthetic}
                onValueChange={(value) => handleInputChange('brandAesthetic', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your brand aesthetic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal & Clean</SelectItem>
                  <SelectItem value="luxury">Luxury & Premium</SelectItem>
                  <SelectItem value="modern">Modern & Contemporary</SelectItem>
                  <SelectItem value="vintage">Vintage & Classic</SelectItem>
                  <SelectItem value="bold">Bold & Vibrant</SelectItem>
                  <SelectItem value="natural">Natural & Organic</SelectItem>
                  <SelectItem value="playful">Playful & Fun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand Colors */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Brand Colors
              </label>
              <div className="space-y-2">
                {formData.brandColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="flex-1"
                      placeholder="#000000"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeColor(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {formData.brandColors.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addColor}
                  >
                    Add Color
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Brand Requirements
              </label>
              <Textarea
                value={formData.brandRequirements}
                onChange={(e) => handleInputChange('brandRequirements', e.target.value)}
                placeholder="Any specific requirements or style preferences for your brand images..."
                rows={3}
              />
            </div>
          </div>

              <Separator />
            </>
          )}

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Settings</h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={formData.notificationsEmail}
                  onCheckedChange={(checked) =>
                    handleInputChange('notificationsEmail', checked)
                  }
                />
                <label htmlFor="email-notifications" className="text-sm font-medium">
                  Email notifications
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp-notifications"
                  checked={formData.notificationsWhatsApp}
                  onCheckedChange={(checked) =>
                    handleInputChange('notificationsWhatsApp', checked)
                  }
                />
                <label htmlFor="whatsapp-notifications" className="text-sm font-medium">
                  WhatsApp notifications
                </label>
              </div>

              {formData.notificationsWhatsApp && (
                <div className="ml-6 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    WhatsApp Number
                  </label>
                  <Input
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preferences</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Language
                </label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Timezone (for notifications & scheduling)
                </label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleInputChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Africa/Nairobi">East Africa Time (Nairobi)</SelectItem>
                    <SelectItem value="Africa/Lagos">West Africa Time (Lagos)</SelectItem>
                    <SelectItem value="Africa/Cairo">Egypt (Cairo)</SelectItem>
                    <SelectItem value="Africa/Johannesburg">South Africa (Johannesburg)</SelectItem>
                    <SelectItem value="Africa/Casablanca">Morocco (Casablanca)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}