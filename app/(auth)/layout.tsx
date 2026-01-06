export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Duma AI</h1>
        <p className="text-gray-600">Professional AI-powered product photo editing</p>
      </div>
      {children}
    </div>
  )
}
