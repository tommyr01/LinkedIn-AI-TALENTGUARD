import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Users, Building2, BarChart3, ArrowRight } from 'lucide-react'

export default function HomePage() {
  console.log('HomePage rendering at:', new Date().toISOString())
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern hero section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/50" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Header */}
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-lg opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 shadow-xl">
                  <Target className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                TalentGuard
                <span className="block text-4xl md:text-5xl mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Buyer Intelligence
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Identify and engage buying committee members 
                <span className="font-semibold text-blue-600"> 10x faster</span> with 
                AI-powered prospect research
              </p>
            </div>
          </div>

          {/* Modern feature cards */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Company Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Find target companies and identify complete buying committees with intelligent filtering
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">AI Enrichment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  LinkedIn scraping and web research with intelligent analysis powered by GPT-4
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Signal Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  TalentGuard-specific scoring to prioritize your best prospects with buying signals
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Modern CTA */}
          <div className="mt-20 text-center">
            <p className="text-lg text-gray-600 mb-8">Ready to transform your prospecting?</p>
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}