import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center flex flex-col items-center animate-fade-in-up">
        <div className="relative w-24 h-24">
          <Image
            src="/duma-logo.png"
            alt="Duma Logo"
            width={96}
            height={96}
            className="object-contain"
            priority
          />
        </div>
      </div>
      {children}
    </div>
  )
}
