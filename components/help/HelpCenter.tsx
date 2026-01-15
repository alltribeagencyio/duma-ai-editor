'use client'

import { useState } from 'react'
import { Search, Book, MessageCircle, Mail, HelpCircle, ChevronDown, ChevronUp, Ticket } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create my first product image?',
    answer: 'Click on "New Edit" in the sidebar, upload your product images, choose or write a prompt describing how you want the image edited, and click generate. Your edited images will be ready in minutes!'
  },
  {
    category: 'Getting Started',
    question: 'What image formats are supported?',
    answer: 'We support JPG, PNG, WEBP, and HEIC formats. Each image should be under 5MB, and you can upload up to 10 images at once.'
  },
  {
    category: 'Credits & Billing',
    question: 'How do credits work?',
    answer: 'Each image generation uses 1 credit. Your monthly credits reset on the first day of each month. Unused credits do not roll over. Practice credits are one-time use and don&apos;t expire.'
  },
  {
    category: 'Credits & Billing',
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes! Go to the Subscription page to view available plans. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.'
  },
  {
    category: 'Credits & Billing',
    question: 'What happens if I run out of credits?',
    answer: 'You won&apos;t be able to generate new images until your credits reset or you purchase additional credits. Your existing images and history remain accessible.'
  },
  {
    category: 'Features',
    question: 'What are brand prompts?',
    answer: 'Brand prompts are custom prompts tailored to your brand&apos;s style, colors, and aesthetic. Set them up in your profile or during onboarding, and they&apos;ll be available as quick options when editing images.'
  },
  {
    category: 'Features',
    question: 'Can I re-edit an image?',
    answer: 'Yes! In your History page, click on any completed job and select "Re-edit" to create a new version with different prompts. Re-edits cost 1 credit per image.'
  },
  {
    category: 'Features',
    question: 'How do I receive notifications?',
    answer: 'You can enable email and WhatsApp notifications in your Profile settings. We&apos;ll notify you when your images are ready for download.'
  },
  {
    category: 'Technical',
    question: 'Why is my image generation taking longer than expected?',
    answer: 'Generation typically takes 2-5 minutes. Delays can occur during high traffic periods. Check your History page for status updates, or contact support if processing exceeds 15 minutes.'
  },
  {
    category: 'Technical',
    question: 'What should I do if image generation fails?',
    answer: 'Failed generations don&apos;t consume credits. Try simplifying your prompt, ensuring images meet size requirements, or try again. Contact support if failures persist.'
  },
  {
    category: 'Account',
    question: 'How do I update my brand information?',
    answer: 'Go to Profile > Brand Information section to update your brand name, industry, aesthetic, colors, and requirements. These preferences help personalize your image editing experience.'
  },
  {
    category: 'Account',
    question: 'Can I delete my account?',
    answer: 'Yes. Contact support at support@duma-ai.com with your account email to request account deletion. This action is permanent and cannot be undone.'
  }
]

const categories = ['Getting Started', 'Credits & Billing', 'Features', 'Technical', 'Account']

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <CardHeader>
            <Book className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle className="text-lg">Documentation</CardTitle>
            <CardDescription>
              Learn how to use Duma AI effectively
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
          const chatEvent = new CustomEvent('openChat')
          window.dispatchEvent(chatEvent)
        }}>
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle className="text-lg">Live Chat</CardTitle>
            <CardDescription>
              Chat with our AI support assistant
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
          const ticketEvent = new CustomEvent('openSupportTicket')
          window.dispatchEvent(ticketEvent)
        }}>
          <CardHeader>
            <Ticket className="h-8 w-8 text-orange-600 mb-2" />
            <CardTitle className="text-lg">Create Ticket</CardTitle>
            <CardDescription>
              Submit a detailed support request
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = 'mailto:support@duma-ai.com'}>
          <CardHeader>
            <Mail className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle className="text-lg">Email Support</CardTitle>
            <CardDescription>
              support@duma-ai.com
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          Frequently Asked Questions
        </h2>

        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No results found. Try a different search term.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <div className="text-xs text-gray-500 mb-1">{faq.category}</div>
                      <div className="font-medium text-gray-900">{faq.question}</div>
                    </div>
                    {expandedFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-4 pb-4 text-gray-600 text-sm border-t pt-4">
                      {faq.answer}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
          <CardDescription className="text-gray-700">
            Our support team is available 24/7 to assist you with any questions or issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={() => window.dispatchEvent(new CustomEvent('openChat'))}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Live Chat
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.dispatchEvent(new CustomEvent('openSupportTicket'))}>
              <Ticket className="h-4 w-4 mr-2" />
              Create Support Ticket
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.location.href = 'mailto:support@duma-ai.com'}>
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
