import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Users, Building2, BarChart3, ArrowRight } from 'lucide-react'

export default function HomePage() {
  console.log('HomePage rendering at:', new Date().toISOString())
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="debug-css">CSS Test - This should be red text on yellow background</div>
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-blue-600 rounded-full p-4">
              <Target className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            TalentGuard Buyer Intelligence Platform
          </h1>
          <p className="text-xl text-gray-600">
            Identify and engage buying committee members 10x faster with AI-powered prospect research
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
          <p className="text-gray-600">Ready to find your next prospects?</p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  )
}