import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Terms of Service | Seatherder',
  description: 'Terms of service for using Seatherder event seating management.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-8">
          <Link href="/" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </Button>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="lead">
            Last updated: January 2025
          </p>

          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using Seatherder (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Seatherder is an event seating management platform that helps organizers create
            seating arrangements for their events. The Service includes features such as:
          </p>
          <ul>
            <li>Guest list management and import</li>
            <li>Intelligent table assignment algorithms</li>
            <li>QR code check-in functionality</li>
            <li>Email communication tools</li>
            <li>Multi-round seating rotation</li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>
            To use certain features of the Service, you must create an account. You are
            responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>
            You agree to use the Service only for lawful purposes. You may not:
          </p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the rights of others</li>
            <li>Upload malicious code or attempt to compromise the Service</li>
            <li>Use the Service to send spam or unsolicited communications</li>
            <li>Attempt to access accounts or data belonging to others</li>
          </ul>

          <h2>5. Guest Data and Privacy</h2>
          <p>
            As an event organizer using the Service, you are responsible for:
          </p>
          <ul>
            <li>Obtaining proper consent from guests before entering their information</li>
            <li>Ensuring guest data is accurate and up-to-date</li>
            <li>Complying with applicable data protection laws (such as GDPR)</li>
            <li>Informing guests about how their data will be used</li>
          </ul>
          <p>
            We process guest data on your behalf as a data processor. See our{' '}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{' '}
            for details on how we handle data.
          </p>

          <h2>6. Subscription and Payments</h2>
          <p>
            Some features of the Service require a paid subscription. By subscribing, you agree to:
          </p>
          <ul>
            <li>Pay the applicable fees as described at the time of purchase</li>
            <li>Provide accurate billing information</li>
            <li>Authorize us to charge your payment method for recurring fees</li>
          </ul>
          <p>
            Subscriptions renew automatically unless cancelled before the renewal date.
            Refunds are provided at our discretion.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service, including its design, features, and content, is protected by copyright
            and other intellectual property laws. You may not copy, modify, or distribute any
            part of the Service without our written permission.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR
            ERROR-FREE.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF
            THE SERVICE.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of significant
            changes by posting a notice on the Service or sending you an email. Continued use
            of the Service after changes take effect constitutes acceptance of the new terms.
          </p>

          <h2>11. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time for violation
            of these Terms or for any other reason. You may also delete your account at any
            time through your account settings.
          </p>

          <h2>12. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@seatherder.com" className="text-primary hover:underline">
              legal@seatherder.com
            </a>
            .
          </p>
        </article>
      </div>
    </div>
  )
}
