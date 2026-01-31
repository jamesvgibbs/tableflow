import { ArrowLeft, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BulletList,
  ContactCard,
  Divider,
  ImportantNotice,
  NumberedList,
  Paragraph,
  Section,
  Strong,
  SubSection,
  TableOfContents,
} from "@/components/legal-content";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service | Seatherder",
  description:
    "Terms of service for using Seatherder event seating management.",
};

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

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        <ImportantNotice>
          <p className="mb-4">
            PLEASE READ THESE TERMS OF SERVICE CAREFULLY BEFORE USING
            SEATHERDER. BY ACCESSING OR USING THE SERVICE, YOU AGREE TO BE BOUND
            BY THESE TERMS.
          </p>
          <p>
            IF YOU DO NOT AGREE TO THESE TERMS, PLEASE DO NOT USE THE SERVICE.
          </p>
        </ImportantNotice>

        <Divider />

        <TableOfContents
          items={[
            "Agreement to Terms",
            "Description of Service",
            "User Accounts",
            "Acceptable Use",
            "Guest Data and Privacy",
            "Subscription and Payments",
            "Intellectual Property",
            "Disclaimer of Warranties",
            "Limitation of Liability",
            "Indemnification",
            "Changes to Terms",
            "Termination",
            "Contact",
          ]}
        />

        <Divider />

        <Section id="agreement-to-terms" title="1. Agreement to Terms">
          <Paragraph>
            By accessing or using Seatherder (&quot;the Service&quot;), you
            agree to be bound by these Terms of Service. These Terms constitute
            a legally binding agreement between you and Seatherder.
          </Paragraph>
          <Paragraph>
            We may update these Terms from time to time. Continued use of the
            Service after changes take effect constitutes acceptance of the new
            terms.
          </Paragraph>
        </Section>

        <Section id="description-of-service" title="2. Description of Service">
          <Paragraph>
            Seatherder is an event seating management platform that helps
            organizers create intelligent seating arrangements for their events.
            The Service includes features such as:
          </Paragraph>
          <BulletList
            items={[
              "Guest list management and CSV import",
              "Intelligent table assignment algorithms with customizable matching preferences",
              "Multi-round seating rotation for networking events",
              "QR code check-in functionality",
              "Email communication tools (invitations, confirmations, reminders)",
              "Real-time round timer with pause/resume",
              "Guest self-service portal for RSVP and dietary updates",
              "Breakout rooms and sessions management",
              "Event theming with preset and custom colors",
            ]}
          />
        </Section>

        <Section id="user-accounts" title="3. User Accounts">
          <Paragraph>
            To use certain features of the Service, you must create an account.
            You are responsible for:
          </Paragraph>
          <BulletList
            items={[
              "Maintaining the confidentiality of your account credentials",
              "All activities that occur under your account",
              "Notifying us immediately of any unauthorized access",
              "Providing accurate and current account information",
            ]}
          />
          <Paragraph>
            You may not create an account using false information or on behalf
            of someone else without permission.
          </Paragraph>
        </Section>

        <Section id="acceptable-use" title="4. Acceptable Use">
          <Paragraph>
            You agree to use the Service only for lawful purposes. You may not:
          </Paragraph>
          <BulletList
            items={[
              "Violate any applicable laws or regulations",
              "Infringe on the rights of others",
              "Upload malicious code or attempt to compromise the Service",
              "Use the Service to send spam or unsolicited communications",
              "Attempt to access accounts or data belonging to others",
              "Reverse engineer or attempt to extract source code from the Service",
              "Use automated systems to access the Service without permission",
              "Interfere with or disrupt the Service or its infrastructure",
            ]}
          />
        </Section>

        <Section id="guest-data-and-privacy" title="5. Guest Data and Privacy">
          <Paragraph>
            As an event organizer using the Service, you are responsible for:
          </Paragraph>
          <BulletList
            items={[
              "Obtaining proper consent from guests before entering their information",
              "Ensuring guest data is accurate and up-to-date",
              "Complying with applicable data protection laws (such as GDPR, CCPA)",
              "Informing guests about how their data will be used",
              "Responding to guest requests regarding their personal data",
            ]}
          />
          <ImportantNotice variant="info">
            We process guest data on your behalf as a data processor. See our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            for details on how we handle data.
          </ImportantNotice>
        </Section>

        <Section
          id="subscription-and-payments"
          title="6. Subscription and Payments"
        >
          <SubSection title="Subscription Plans">
            <Paragraph>
              Some features of the Service require a paid subscription. By
              subscribing, you agree to:
            </Paragraph>
            <BulletList
              items={[
                "Pay the applicable fees as described at the time of purchase",
                "Provide accurate billing information",
                "Authorize us to charge your payment method for recurring fees",
              ]}
            />
          </SubSection>

          <SubSection title="Automatic Renewal">
            <Paragraph>
              Subscriptions renew automatically unless cancelled before the
              renewal date. You will be charged the then-current subscription
              price plus applicable taxes.
            </Paragraph>
          </SubSection>

          <SubSection title="Refunds">
            <Paragraph>
              Refunds are provided at our discretion. We may provide refunds
              for:
            </Paragraph>
            <BulletList
              items={[
                "Technical issues that prevent access to the Service for an extended period",
                "Billing errors (duplicate charges, incorrect amounts)",
                "As required by applicable consumer protection laws",
              ]}
            />
          </SubSection>

          <SubSection title="Cancellation">
            <Paragraph>
              You may cancel your subscription at any time through your account
              settings. Cancellation is effective at the end of your current
              billing period. You retain access to paid features until then.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="intellectual-property" title="7. Intellectual Property">
          <Paragraph>
            The Service, including its design, features, and content, is
            protected by copyright and other intellectual property laws. You may
            not copy, modify, or distribute any part of the Service without our
            written permission.
          </Paragraph>
          <Paragraph>
            You retain ownership of the content you upload to the Service. By
            uploading content, you grant us a license to use it solely for the
            purpose of providing the Service.
          </Paragraph>
        </Section>

        <Section
          id="disclaimer-of-warranties"
          title="8. Disclaimer of Warranties"
        >
          <ImportantNotice>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY
            KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE
            SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            <p className="mt-3 font-normal">
              We do not warrant that the seating algorithm will produce optimal
              results for every situation. The Service is a tool to assist with
              event planning, not a guarantee of successful events.
            </p>
          </ImportantNotice>
        </Section>

        <Section
          id="limitation-of-liability"
          title="9. Limitation of Liability"
        >
          <ImportantNotice>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SEATHERDER SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            <p className="mt-3 font-normal">
              Our total liability for any claims arising from your use of the
              Service shall not exceed the amount you paid to us in the twelve
              (12) months preceding the claim, or $100, whichever is greater.
            </p>
          </ImportantNotice>
        </Section>

        <Section id="indemnification" title="10. Indemnification">
          <Paragraph>
            You agree to indemnify and hold harmless Seatherder and its
            officers, directors, employees, and agents from any claims,
            liabilities, damages, losses, or expenses arising from:
          </Paragraph>
          <NumberedList
            items={[
              "Your use of the Service",
              "Your violation of these Terms",
              "Your violation of any third-party rights",
              "Content you upload to the Service",
              "Your failure to obtain proper consent from guests",
            ]}
          />
        </Section>

        <Section id="changes-to-terms" title="11. Changes to Terms">
          <Paragraph>
            We may update these Terms from time to time. We will notify you of
            significant changes by:
          </Paragraph>
          <BulletList
            items={[
              "Posting a notice on the Service",
              "Sending an email to your account email address",
              "Displaying a notification when you access the Service",
            ]}
          />
          <Paragraph>
            Continued use of the Service after changes take effect constitutes
            acceptance of the new terms. If you do not agree to the changes, you
            should stop using the Service.
          </Paragraph>
        </Section>

        <Section id="termination" title="12. Termination">
          <SubSection title="Termination by You">
            <Paragraph>
              You may delete your account at any time through your account
              settings. Upon deletion, your data will be removed according to
              our Privacy Policy.
            </Paragraph>
          </SubSection>

          <SubSection title="Termination by Us">
            <Paragraph>
              We may suspend or terminate your access to the Service at any time
              for:
            </Paragraph>
            <BulletList
              items={[
                "Violation of these Terms",
                "Violation of applicable law",
                "Fraudulent, harassing, or abusive behavior",
                "Extended periods of inactivity",
                "Technical or security reasons",
              ]}
            />
          </SubSection>

          <SubSection title="Effect of Termination">
            <Paragraph>Upon termination:</Paragraph>
            <BulletList
              items={[
                "Your right to access the Service immediately ceases",
                "You remain liable for all obligations incurred prior to termination",
                "We may delete your data according to our retention policies",
                "Provisions that should survive termination (such as limitation of liability) will remain in effect",
              ]}
            />
          </SubSection>
        </Section>

        <Section id="contact" title="13. Contact">
          <Paragraph>
            If you have questions about these Terms, please contact us:
          </Paragraph>
          <div className="grid sm:grid-cols-1 gap-4 my-6">
            <ContactCard icon={Mail} title="Legal Inquiries">
              <a
                href="mailto:legal@seatherder.com"
                className="text-primary hover:underline"
              >
                legal@seatherder.com
              </a>
            </ContactCard>
          </div>
        </Section>

        <Divider />

        <div className="text-center text-muted-foreground text-sm">
          <p className="mb-2">
            <Strong>Effective Date:</Strong> January 1, 2025 |{" "}
            <Strong>Last Updated:</Strong> January 2025
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>🐕</span> Seatherder. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
