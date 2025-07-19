'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconTarget, IconUsers, IconBuilding, IconChartBar, IconArrowRight } from '@tabler/icons-react'
import { useEffect } from 'react'

export default function HomePage() {
  // Prevent any automatic navigation
  useEffect(() => {
    // This will ensure we stay on this page
    console.log('Homepage mounted - no redirect')
  }, [])
  return (
    <div className="min-h-screen">
      {/* Modern hero section */}
      <div className="relative overflow-hidden">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Header */}
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-primary rounded-3xl p-6">
                <IconTarget className="h-12 w-12 text-primary-foreground" />
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
                  <IconBuilding className="h-8 w-8 text-white" />
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
                  <IconUsers className="h-8 w-8 text-white" />
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
                  <IconChartBar className="h-8 w-8 text-white" />
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
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-6 text-lg">
                Get Started
                <IconArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}