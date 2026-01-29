'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COOKIE_CONSENT_KEY = 'seatherder_cookie_consent'

type ConsentValue = 'accepted' | 'declined' | null

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  useEffect(() => {
    // Check localStorage for existing consent
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (storedConsent === 'accepted' || storedConsent === 'declined') {
      setConsent(storedConsent)
    } else {
      // No consent stored, show the banner after a brief delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleConsent = (value: 'accepted' | 'declined') => {
    setIsAnimatingOut(true)
    // Wait for animation to complete before hiding
    setTimeout(() => {
      localStorage.setItem(COOKIE_CONSENT_KEY, value)
      setConsent(value)
      setIsVisible(false)
    }, 300)
  }

  const handleAccept = () => handleConsent('accepted')
  const handleDecline = () => handleConsent('declined')

  // Don't render if consent already given or not ready to show
  if (consent !== null || !isVisible) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6',
        'transform transition-all duration-300 ease-out',
        isAnimatingOut ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <div className="container mx-auto max-w-4xl">
        <div className="relative bg-background border rounded-lg shadow-lg p-4 md:p-6">
          {/* Close button (same as decline) */}
          <button
            onClick={handleDecline}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Decline cookies"
          >
            <X className="size-4" />
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon and text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Cookie className="size-5 text-primary" />
              </div>
              <div className="space-y-1 pr-6 md:pr-0">
                <p className="font-medium text-sm">I use cookies to remember you</p>
                <p className="text-sm text-muted-foreground">
                  Essential cookies keep you signed in. Analytics cookies help me understand how
                  people use this app so I can make it better. No tracking, no ads, no selling
                  your data.{' '}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Read my privacy policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecline}
                className="flex-1 md:flex-none"
              >
                Essential only
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                className="flex-1 md:flex-none"
              >
                Accept all
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to check if cookies have been accepted
 * Useful for conditionally loading analytics
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (storedConsent === 'accepted' || storedConsent === 'declined') {
      setConsent(storedConsent)
    }
    setIsLoading(false)
  }, [])

  return {
    consent,
    isLoading,
    hasAccepted: consent === 'accepted',
    hasDeclined: consent === 'declined',
    hasMadeChoice: consent !== null,
  }
}
