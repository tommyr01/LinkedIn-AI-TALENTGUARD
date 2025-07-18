"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Users, Building2, BarChart3 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Automatic redirect after a short delay
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  const handleGetStarted = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">TalentGuard</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Buyer Intelligence Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Identify and engage buying committee members 10x faster with AI-powered 
            prospect research and signal intelligence
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Company Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Find target companies and identify complete buying committees
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">AI Enrichment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                LinkedIn scraping and web research with intelligent analysis
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Signal Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                TalentGuard-specific scoring to prioritize your best prospects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="text-lg px-8 py-3"
          >
            Get Started
          </Button>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard in a few seconds...
          </p>
        </div>
      </div>
    </div>
  )
}