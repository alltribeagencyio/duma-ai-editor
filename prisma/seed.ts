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

  // Check if presets already exist
  const existingCount = await prisma.promptPreset.count()

  if (existingCount === 0) {
    // Create all presets
    await prisma.promptPreset.createMany({
      data: presets,
    })
    console.log('✅ Seed data created successfully')
  } else {
    console.log('✅ Seed data already exists, skipping...')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
