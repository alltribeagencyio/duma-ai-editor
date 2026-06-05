import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center justify-center animate-fade-in-up">
        <Image
          src="/duma-logo-no-bg.png"
          alt="Duma AI"
          width={220}
          height={88}
          className="h-16 w-auto object-contain drop-shadow-[0_8px_24px_rgba(173,0,171,0.25)]"
          priority
        />
      </div>
      {children}
    </div>
  )
}
