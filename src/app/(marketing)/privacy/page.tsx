import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Privacy Policy | Seatherder',
  description: 'Privacy policy for Seatherder event seating management platform.',
}

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="lead">
            Last updated: January 2025
          </p>

          <p>
            At Seatherder, we take your privacy seriously. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our event
            seating management service.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>Account Information</h3>
          <p>
            When you create an account, we collect:
          </p>
          <ul>
            <li>Your name and email address</li>
            <li>Account credentials (managed securely through our authentication provider)</li>
            <li>Payment information (processed by our payment provider)</li>
          </ul>

          <h3>Event and Guest Data</h3>
          <p>
            When you use the Service to manage events, we store:
          </p>
          <ul>
            <li>Event details (name, date, settings)</li>
            <li>Guest information you provide (names, emails, dietary restrictions, etc.)</li>
            <li>Seating assignments and check-in records</li>
            <li>Communication logs (emails sent through the Service)</li>
          </ul>

          <h3>Usage Data</h3>
          <p>
            We automatically collect certain information when you use the Service:
          </p>
          <ul>
            <li>Log data (IP address, browser type, pages visited)</li>
            <li>Device information</li>
            <li>Analytics about how you use the Service</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide and maintain the Service</li>
            <li>Process your transactions</li>
            <li>Send you service-related communications</li>
            <li>Improve and optimize the Service</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Guest Data Handling</h2>
          <p>
            As an event organizer, you upload guest information to the Service. In this
            relationship:
          </p>
          <ul>
            <li>
              <strong>You are the data controller</strong> - responsible for ensuring you have
              proper consent from guests and comply with applicable laws
            </li>
            <li>
              <strong>We are the data processor</strong> - we process guest data only on your
              behalf and according to your instructions
            </li>
          </ul>
          <p>
            Guest data is used solely to provide the Service and is not sold, shared, or used
            for marketing purposes.
          </p>

          <h2>4. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to:
          </p>
          <ul>
            <li>Keep you signed in</li>
            <li>Remember your preferences</li>
            <li>Analyze usage patterns</li>
          </ul>
          <p>
            You can control cookies through your browser settings. Note that disabling cookies
            may affect the functionality of the Service.
          </p>

          <h3>Types of Cookies We Use</h3>
          <ul>
            <li>
              <strong>Essential cookies:</strong> Required for the Service to function (authentication, security)
            </li>
            <li>
              <strong>Analytics cookies:</strong> Help us understand how you use the Service
            </li>
            <li>
              <strong>Preference cookies:</strong> Remember your settings and choices
            </li>
          </ul>

          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share data with:
          </p>
          <ul>
            <li>
              <strong>Service providers:</strong> Companies that help us operate the Service
              (hosting, email delivery, payment processing)
            </li>
            <li>
              <strong>Legal authorities:</strong> When required by law or to protect our rights
            </li>
            <li>
              <strong>Business transfers:</strong> In connection with a merger, acquisition, or
              sale of assets
            </li>
          </ul>

          <h2>6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data:
          </p>
          <ul>
            <li>Encryption of data in transit (TLS/SSL)</li>
            <li>Secure data storage with access controls</li>
            <li>Regular security assessments</li>
            <li>Employee access limitations</li>
          </ul>
          <p>
            However, no method of transmission over the Internet is 100% secure. While we strive
            to protect your data, we cannot guarantee absolute security.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide
            the Service. Event and guest data is retained for:
          </p>
          <ul>
            <li>Active events: Until you delete the event</li>
            <li>Deleted events: Removed within 30 days</li>
            <li>Account data: Until you delete your account</li>
          </ul>
          <p>
            Some data may be retained longer if required by law or for legitimate business
            purposes.
          </p>

          <h2>8. Your Rights</h2>
          <p>
            Depending on your location, you may have the right to:
          </p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to certain processing</li>
            <li>Withdraw consent</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@seatherder.com" className="text-primary hover:underline">
              privacy@seatherder.com
            </a>
            .
          </p>

          <h2>9. International Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your own.
            We ensure appropriate safeguards are in place for such transfers in compliance
            with applicable laws.
          </p>

          <h2>10. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for children under 13. We do not knowingly collect
            personal information from children. If you believe we have collected data from a
            child, please contact us.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            significant changes by posting a notice on the Service or sending you an email.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, contact us at:
          </p>
          <ul>
            <li>
              Email:{' '}
              <a href="mailto:privacy@seatherder.com" className="text-primary hover:underline">
                privacy@seatherder.com
              </a>
            </li>
          </ul>
        </article>
      </div>
    </div>
  )
}
