import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="relative w-32 h-32 mb-4">
          <Image
            src="/duma-logo.png"
            alt="Duma Logo"
            width={128}
            height={128}
            className="object-contain"
            priority
          />
        </div>
      </div>
      {children}
    </div>
  )
}
