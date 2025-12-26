"use client"

import { useState, useEffect } from "react"
import { ResponsiveSidebar } from "@/components/layout/responsive-sidebar"
import { ErrorBoundary } from "@/components/error-boundary"
import { useIsMobile } from "@/hooks/use-mobile"

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode
}

export default function ResponsiveDashboardLayout({ 
  children 
}: ResponsiveDashboardLayoutProps) {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a basic layout during SSR
    return (
      <div className="flex h-screen">
        <div className="w-64 h-full border-r bg-background" />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-background ${isMobile ? 'flex flex-col' : 'flex'}`}>
        <ResponsiveSidebar />
        
        <main className={`flex-1 overflow-y-auto bg-background ${isMobile ? '' : ''}`}>
          <div className={`container mx-auto p-4 md:p-6 ${isMobile ? 'pt-0' : ''}`}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}