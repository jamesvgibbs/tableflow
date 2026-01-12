'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Search, ArrowRight } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Seatherder
          </h1>
          <p className="text-xl text-muted-foreground">
            Event seating made simple
          </p>
        </div>

        {/* Two Path Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Admin Path */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/70" />
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                {isAuthenticated ? "Admin Portal" : "Host an Event"}
              </CardTitle>
              <CardDescription className="text-base">
                {isAuthenticated
                  ? "Manage your events, tables, and check-ins"
                  : "Set up seating, assign tables, and welcome your guests"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href={isAuthenticated ? "/admin" : "/login"}>
                <Button className="w-full gap-2" size="lg">
                  {isLoading ? (
                    "Loading..."
                  ) : isAuthenticated ? (
                    <>
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* User Path */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Search className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Find My Table</CardTitle>
              <CardDescription className="text-base">
                Search for your name to find your table assignment and check in
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/checkin">
                <Button variant="outline" className="w-full gap-2 border-green-500/50 hover:bg-green-500/10 hover:text-green-700" size="lg">
                  Search & Check In
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          Guests can also scan their personal QR code to find their table
        </p>
      </div>
    </div>
  )
}
