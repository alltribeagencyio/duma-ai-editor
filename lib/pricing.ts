import { prisma } from './prisma'

export interface PricingPlanConfig {
  plan: 'personal' | 'business'
  displayName: string
  ratePerImage: number // USD per image
  minimumInitialPurchase: number // USD
  minimumTopUp: number // USD
  description?: string
  features: string[]
  isActive: boolean
}

export const DEFAULT_PRICING_PLANS: PricingPlanConfig[] = [
  {
    plan: 'personal',
    displayName: 'Personal Plan',
    ratePerImage: 0.375,
    minimumInitialPurchase: 2.0,
    minimumTopUp: 1.5,
    description: 'Perfect for individuals and small projects',
    features: [
      '$0.375 per image',
      'All editing features',
      'High-quality outputs',
      'Email support',
      'Flexible top-ups from $1.50'
    ],
    isActive: true
  },
  {
    plan: 'business',
    displayName: 'Business Plan',
    ratePerImage: 0.35,
    minimumInitialPurchase: 20.0,
    minimumTopUp: 10.0,
    description: 'Best value for businesses and high-volume users',
    features: [
      '$0.35 per image (7% savings)',
      'All editing features',
      'High-quality outputs',
      'Priority support',
      'Bulk processing',
      'Flexible top-ups from $10'
    ],
    isActive: true
  }
]

class PricingService {
  /**
   * Initialize default pricing plans in database
   */
  async initializeDefaultPlans() {
    try {
      for (const plan of DEFAULT_PRICING_PLANS) {
        await prisma.pricingConfig.upsert({
          where: { plan: plan.plan },
          create: plan,
          update: plan
        })
      }
      console.log('✅ Default pricing plans initialized')
    } catch (error) {
      console.error('Error initializing pricing plans:', error)
      throw error
    }
  }

  /**
   * Get pricing configuration for a specific plan
   */
  async getPlanConfig(plan: 'personal' | 'business') {
    try {
      const config = await prisma.pricingConfig.findUnique({
        where: { plan, isActive: true }
      })

      if (!config) {
        // Fallback to default if not found
        return DEFAULT_PRICING_PLANS.find(p => p.plan === plan)
      }

      return config
    } catch (error) {
      console.error('Error fetching plan config:', error)
      return DEFAULT_PRICING_PLANS.find(p => p.plan === plan)
    }
  }

  /**
   * Get all active pricing plans
   */
  async getAllPlans() {
    try {
      const plans = await prisma.pricingConfig.findMany({
        where: { isActive: true },
        orderBy: { ratePerImage: 'asc' }
      })

      if (plans.length === 0) {
        return DEFAULT_PRICING_PLANS
      }

      return plans
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
      return DEFAULT_PRICING_PLANS
    }
  }

  /**
   * Calculate credits for a purchase amount
   */
  calculateCredits(amountUSD: number, ratePerImage: number): number {
    return amountUSD / ratePerImage
  }

  /**
   * Calculate cost for a number of images
   */
  calculateCost(numberOfImages: number, ratePerImage: number): number {
    return numberOfImages * ratePerImage
  }

  /**
   * Validate purchase amount against plan rules
   */
  async validatePurchase(
    userId: string,
    amountUSD: number,
    targetPlan: 'personal' | 'business'
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          hasCompletedInitialPurchase: true,
          pricingPlan: true
        }
      })

      if (!user) {
        return { valid: false, error: 'User not found' }
      }

      const planConfig = await this.getPlanConfig(targetPlan)

      if (!planConfig) {
        return { valid: false, error: 'Invalid pricing plan' }
      }

      // Check if this is an initial purchase or plan upgrade
      const isInitialPurchase = !user.hasCompletedInitialPurchase
      const isPlanUpgrade = user.pricingPlan === 'personal' && targetPlan === 'business'

      if (isInitialPurchase || isPlanUpgrade) {
        // Must meet minimum initial purchase
        if (amountUSD < planConfig.minimumInitialPurchase) {
          return {
            valid: false,
            error: `Minimum initial purchase for ${planConfig.displayName} is $${planConfig.minimumInitialPurchase.toFixed(2)}`
          }
        }
      } else {
        // Regular top-up
        if (amountUSD < planConfig.minimumTopUp) {
          return {
            valid: false,
            error: `Minimum top-up for ${planConfig.displayName} is $${planConfig.minimumTopUp.toFixed(2)}`
          }
        }
      }

      return { valid: true }
    } catch (error) {
      console.error('Error validating purchase:', error)
      return { valid: false, error: 'Failed to validate purchase' }
    }
  }

  /**
   * Process credit purchase - allocate credits to user
   */
  async allocateCredits(
    userId: string,
    amountUSD: number,
    pricingPlan: 'personal' | 'business',
    paymentId: string
  ) {
    try {
      const planConfig = await this.getPlanConfig(pricingPlan)

      if (!planConfig) {
        throw new Error('Invalid pricing plan')
      }

      const creditsToAdd = this.calculateCredits(amountUSD, planConfig.ratePerImage)

      // Get current user balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true, hasCompletedInitialPurchase: true, pricingPlan: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const balanceBefore = user.creditBalance
      const balanceAfter = balanceBefore + creditsToAdd

      // Update user balance and plan
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: balanceAfter,
          pricingPlan,
          hasCompletedInitialPurchase: true
        }
      })

      // Create transaction record
      await prisma.creditTransaction.create({
        data: {
          userId,
          type: 'purchase',
          amount: amountUSD,
          creditsAdded: creditsToAdd,
          balanceBefore,
          balanceAfter,
          pricingPlan,
          ratePerImage: planConfig.ratePerImage,
          paymentId,
          description: `Purchased ${creditsToAdd.toFixed(0)} credits for $${amountUSD.toFixed(2)} on ${planConfig.displayName}`
        }
      })

      console.log(`✅ Allocated ${creditsToAdd} credits to user ${userId}`)

      return {
        success: true,
        creditsAdded: creditsToAdd,
        newBalance: balanceAfter
      }
    } catch (error) {
      console.error('Error allocating credits:', error)
      throw error
    }
  }

  /**
   * Deduct credits for image processing
   */
  async deductCredits(
    userId: string,
    numberOfImages: number,
    jobId: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true, pricingPlan: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const planConfig = await this.getPlanConfig(user.pricingPlan as 'personal' | 'business')

      if (!planConfig) {
        throw new Error('Invalid pricing plan')
      }

      const costUSD = this.calculateCost(numberOfImages, planConfig.ratePerImage)

      if (user.creditBalance < costUSD) {
        throw new Error('Insufficient credits')
      }

      const balanceBefore = user.creditBalance
      const balanceAfter = balanceBefore - costUSD

      // Update user balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: balanceAfter,
          creditsUsed: { increment: numberOfImages }
        }
      })

      // Create transaction record
      await prisma.creditTransaction.create({
        data: {
          userId,
          type: 'deduction',
          amount: costUSD,
          creditsDeducted: costUSD,
          balanceBefore,
          balanceAfter,
          pricingPlan: user.pricingPlan,
          ratePerImage: planConfig.ratePerImage,
          jobId,
          description: `Processed ${numberOfImages} image${numberOfImages > 1 ? 's' : ''} at $${planConfig.ratePerImage} per image`
        }
      })

      console.log(`✅ Deducted $${costUSD.toFixed(2)} from user ${userId}`)

      return {
        success: true,
        costUSD,
        creditsDeducted: costUSD,
        newBalance: balanceAfter
      }
    } catch (error) {
      console.error('Error deducting credits:', error)
      throw error
    }
  }

  /**
   * Check if user has sufficient credits
   */
  async checkSufficientCredits(userId: string, numberOfImages: number): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true, pricingPlan: true }
      })

      if (!user) {
        return false
      }

      const planConfig = await this.getPlanConfig(user.pricingPlan as 'personal' | 'business')

      if (!planConfig) {
        return false
      }

      const requiredCredits = this.calculateCost(numberOfImages, planConfig.ratePerImage)

      return user.creditBalance >= requiredCredits
    } catch (error) {
      console.error('Error checking credits:', error)
      return false
    }
  }

  /**
   * Get user's current credit info
   */
  async getUserCreditInfo(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          creditBalance: true,
          pricingPlan: true,
          creditsUsed: true,
          hasCompletedInitialPurchase: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const planConfig = await this.getPlanConfig(user.pricingPlan as 'personal' | 'business')

      if (!planConfig) {
        throw new Error('Invalid pricing plan')
      }

      const imagesAvailable = Math.floor(user.creditBalance / planConfig.ratePerImage)

      return {
        creditBalance: user.creditBalance,
        pricingPlan: user.pricingPlan,
        ratePerImage: planConfig.ratePerImage,
        imagesAvailable,
        totalImagesProcessed: user.creditsUsed,
        hasCompletedInitialPurchase: user.hasCompletedInitialPurchase
      }
    } catch (error) {
      console.error('Error fetching user credit info:', error)
      throw error
    }
  }
}

export const pricingService = new PricingService()
