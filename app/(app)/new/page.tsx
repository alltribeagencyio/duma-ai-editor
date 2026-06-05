import dynamic from 'next/dynamic'

const MultiStepForm = dynamic(
  () => import('@/components/new-edit/MultiStepForm').then(mod => ({ default: mod.MultiStepForm })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-duma-primary/20 border-t-duma-primary" />
      </div>
    ),
    ssr: false
  }
)

export default function NewEditPage() {
  return <MultiStepForm />
}
