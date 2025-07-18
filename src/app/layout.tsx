import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TalentGuard Buyer Intelligence',
  description: 'AI-powered buyer intelligence platform for TalentGuard sales and marketing teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}