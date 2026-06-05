'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PhoneInput } from '@/components/ui/phone-input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Upload, X, Plus } from 'lucide-react'

interface CustomerProfile {
  name: string
  age?: string
  gender?: string
  interests?: string
  demographics?: string
  description?: string
}

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
  brandLogo?: string
  customerProfiles?: CustomerProfile[]
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
    brandLogo: profile.brandLogo || '',
    customerProfiles: profile.customerProfiles || [],
  })

  const [isCustomerProfilesOpen, setIsCustomerProfilesOpen] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'brand-logos')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { url } = await response.json()
        handleInputChange('brandLogo', url)
      } else {
        alert('Failed to upload logo. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo. Please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const removeLogo = () => {
    handleInputChange('brandLogo', '')
  }

  const addCustomerProfile = () => {
    const newProfile: CustomerProfile = {
      name: '',
      age: '',
      gender: '',
      interests: '',
      demographics: '',
      description: ''
    }
    setFormData(prev => ({
      ...prev,
      customerProfiles: [...prev.customerProfiles, newProfile]
    }))
    setIsCustomerProfilesOpen(true)
  }

  const updateCustomerProfile = (index: number, field: keyof CustomerProfile, value: string) => {
    const newProfiles = [...formData.customerProfiles]
    newProfiles[index] = { ...newProfiles[index], [field]: value }
    setFormData(prev => ({ ...prev, customerProfiles: newProfiles }))
  }

  const removeCustomerProfile = (index: number) => {
    const newProfiles = formData.customerProfiles.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, customerProfiles: newProfiles }))
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
                className="bg-white/30"
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

                {/* Brand Logo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Brand Logo
                  </label>
                  <div className="space-y-2">
                    {formData.brandLogo ? (
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <img
                          src={formData.brandLogo}
                          alt="Brand logo"
                          className="h-20 w-20 object-contain border rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Brand logo uploaded</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeLogo}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload your brand logo</p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="max-w-xs mx-auto"
                        />
                        {uploadingLogo && (
                          <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                        )}
                      </div>
                    )}
                  </div>
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

                {/* Ideal Customer Profiles */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Ideal Customer Profiles
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomerProfile}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Profile
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Define your target customers to help generate more relevant images
                  </p>

                  <div className="space-y-3 mt-3">
                    {formData.customerProfiles.map((profile, index) => (
                      <Collapsible key={index}>
                        <div className="rounded-xl overflow-hidden glass-subtle">
                          <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium">
                                {profile.name || `Customer Profile ${index + 1}`}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCustomerProfile(index)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-4 space-y-3">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-700">
                                Profile Name
                              </label>
                              <Input
                                value={profile.name}
                                onChange={(e) => updateCustomerProfile(index, 'name', e.target.value)}
                                placeholder="e.g., Young Professional, Fashion Enthusiast"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700">
                                  Age Range
                                </label>
                                <Input
                                  value={profile.age || ''}
                                  onChange={(e) => updateCustomerProfile(index, 'age', e.target.value)}
                                  placeholder="e.g., 25-35"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700">
                                  Gender
                                </label>
                                <Input
                                  value={profile.gender || ''}
                                  onChange={(e) => updateCustomerProfile(index, 'gender', e.target.value)}
                                  placeholder="e.g., Female, Male, All"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-700">
                                Interests
                              </label>
                              <Input
                                value={profile.interests || ''}
                                onChange={(e) => updateCustomerProfile(index, 'interests', e.target.value)}
                                placeholder="e.g., Fitness, Travel, Technology"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-700">
                                Demographics
                              </label>
                              <Input
                                value={profile.demographics || ''}
                                onChange={(e) => updateCustomerProfile(index, 'demographics', e.target.value)}
                                placeholder="e.g., Urban, High-income, College-educated"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-700">
                                Description
                              </label>
                              <Textarea
                                value={profile.description || ''}
                                onChange={(e) => updateCustomerProfile(index, 'description', e.target.value)}
                                placeholder="Describe this customer segment in detail..."
                                rows={3}
                              />
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

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
