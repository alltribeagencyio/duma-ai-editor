interface PaystackCustomer {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
}

interface PaystackPlan {
  name: string
  amount: number // in kobo
  interval: 'monthly' | 'annually'
  description?: string
  currency?: string
}

interface PaystackSubscription {
  customer: string // customer code
  plan: string // plan code
  authorization?: string // authorization code for existing customer
}

class PaystackService {
  private secretKey: string
  private baseUrl = 'https://api.paystack.co'

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || ''
    if (!this.secretKey) {
      console.warn('⚠️  PAYSTACK_SECRET_KEY not found in environment variables')
    }
  }

  private async request(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Paystack API error')
    }

    return result
  }

  // Customer Management
  async createCustomer(customer: PaystackCustomer) {
    try {
      const result = await this.request('/customer', 'POST', customer)
      return {
        success: true,
        customer: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getCustomer(customerCode: string) {
    try {
      const result = await this.request(`/customer/${customerCode}`)
      return {
        success: true,
        customer: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Plan Management
  async createPlan(plan: PaystackPlan) {
    try {
      const result = await this.request('/plan', 'POST', {
        ...plan,
        currency: plan.currency || 'NGN'
      })
      return {
        success: true,
        plan: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getPlans() {
    try {
      const result = await this.request('/plan')
      return {
        success: true,
        plans: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Subscription Management
  async createSubscription(subscription: PaystackSubscription) {
    try {
      const result = await this.request('/subscription', 'POST', subscription)
      return {
        success: true,
        subscription: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getSubscription(subscriptionCode: string) {
    try {
      const result = await this.request(`/subscription/${subscriptionCode}`)
      return {
        success: true,
        subscription: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async cancelSubscription(subscriptionCode: string, token: string) {
    try {
      const result = await this.request('/subscription/disable', 'POST', {
        code: subscriptionCode,
        token
      })
      return {
        success: true,
        subscription: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Transaction Management
  async initializeTransaction(data: {
    email: string
    amount: number // in kobo
    reference?: string
    callback_url?: string
    plan?: string
    channels?: string[]
    metadata?: Record<string, any>
  }) {
    try {
      const result = await this.request('/transaction/initialize', 'POST', data)
      return {
        success: true,
        transaction: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const result = await this.request(`/transaction/verify/${reference}`)
      return {
        success: true,
        transaction: result.data
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Webhook signature verification
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto')
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex')

    return hash === signature
  }
}

export const paystackService = new PaystackService()