import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BulletList,
  ContactCard,
  DataTable,
  Divider,
  ImportantNotice,
  Paragraph,
  Section,
  Strong,
  SubSection,
  TableOfContents,
} from "@/components/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy | Seatherder",
  description:
    "Privacy policy for Seatherder event seating management platform.",
};

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

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        <ImportantNotice>
          <p className="mb-4">
            THIS PRIVACY POLICY DESCRIBES HOW SEATHERDER COLLECTS, USES, AND
            PROTECTS YOUR PERSONAL INFORMATION. PLEASE READ THIS POLICY
            CAREFULLY.
          </p>
          <p>
            SEATHERDER IS AN EVENT SEATING MANAGEMENT TOOL. WE TAKE YOUR PRIVACY
            AND THE PRIVACY OF YOUR GUESTS SERIOUSLY.
          </p>
        </ImportantNotice>

        <Divider />

        <TableOfContents
          items={[
            "Information We Collect",
            "How We Use Your Information",
            "Guest Data Handling",
            "Cookies and Tracking",
            "Data Sharing",
            "Data Security",
            "Data Retention",
            "Your Rights",
            "International Transfers",
            "Children's Privacy",
            "Changes to This Policy",
            "Contact Us",
          ]}
        />

        <Divider />

        <Section id="information-we-collect" title="1. Information We Collect">
          <SubSection title="Account Information">
            <Paragraph>When you create an account, we collect:</Paragraph>
            <BulletList
              items={[
                "Your name and email address",
                "Account credentials (managed securely through our authentication provider, Clerk)",
                "Payment information (processed by our payment provider, Stripe)",
              ]}
            />
          </SubSection>

          <SubSection title="Event and Guest Data">
            <Paragraph>
              When you use the Service to manage events, we store:
            </Paragraph>
            <BulletList
              items={[
                "Event details (name, date, settings, theme preferences)",
                "Guest information you provide (names, emails, dietary restrictions, seating preferences)",
                "Seating assignments and check-in records",
                "Communication logs (emails sent through the Service)",
                "Seating history for cross-event optimization",
              ]}
            />
          </SubSection>

          <SubSection title="Usage Data">
            <Paragraph>
              We automatically collect certain information when you use the
              Service:
            </Paragraph>
            <BulletList
              items={[
                "Log data (IP address, browser type, pages visited)",
                "Device information",
                "Analytics about how you use the Service",
              ]}
            />
          </SubSection>
        </Section>

        <Section
          id="how-we-use-your-information"
          title="2. How We Use Your Information"
        >
          <Paragraph>We use the information we collect to:</Paragraph>
          <BulletList
            items={[
              "Provide and maintain the Service",
              "Process your transactions and subscriptions",
              "Send you service-related communications",
              "Generate intelligent seating arrangements using our matching algorithm",
              "Enable QR code check-in for your guests",
              "Send emails on your behalf to guests (invitations, confirmations, reminders)",
              "Improve and optimize the Service",
              "Detect and prevent fraud or abuse",
              "Comply with legal obligations",
            ]}
          />
        </Section>

        <Section id="guest-data-handling" title="3. Guest Data Handling">
          <Paragraph>
            As an event organizer, you upload guest information to the Service.
            In this relationship:
          </Paragraph>
          <BulletList
            items={[
              <>
                <Strong>You are the data controller</Strong> - responsible for
                ensuring you have proper consent from guests and comply with
                applicable laws
              </>,
              <>
                <Strong>We are the data processor</Strong> - we process guest
                data only on your behalf and according to your instructions
              </>,
            ]}
          />
          <ImportantNotice variant="info">
            Guest data is used solely to provide the Service and is not sold,
            shared, or used for marketing purposes. Guests can access their
            information and update preferences through the self-service portal
            if you enable it for your event.
          </ImportantNotice>
        </Section>

        <Section id="cookies-and-tracking" title="4. Cookies and Tracking">
          <Paragraph>We use cookies and similar technologies to:</Paragraph>
          <BulletList
            items={[
              "Keep you signed in",
              "Remember your preferences",
              "Analyze usage patterns",
            ]}
          />

          <SubSection title="Types of Cookies We Use">
            <DataTable
              headers={["Cookie Type", "Purpose"]}
              rows={[
                [
                  "Essential cookies",
                  "Required for the Service to function (authentication, security)",
                ],
                [
                  "Analytics cookies",
                  "Help us understand how you use the Service",
                ],
                [
                  "Preference cookies",
                  "Remember your settings and choices",
                ],
              ]}
            />
            <Paragraph>
              You can control cookies through your browser settings. Note that
              disabling cookies may affect the functionality of the Service.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="data-sharing" title="5. Data Sharing">
          <Paragraph>
            We do not sell your personal information. We may share data with:
          </Paragraph>
          <BulletList
            items={[
              <>
                <Strong>Service providers:</Strong> Companies that help us
                operate the Service (Convex for database, Clerk for
                authentication, Resend for email delivery, Stripe for payment
                processing)
              </>,
              <>
                <Strong>Legal authorities:</Strong> When required by law or to
                protect our rights
              </>,
              <>
                <Strong>Business transfers:</Strong> In connection with a
                merger, acquisition, or sale of assets
              </>,
            ]}
          />
        </Section>

        <Section id="data-security" title="6. Data Security">
          <Paragraph>
            We implement industry-standard security measures to protect your
            data:
          </Paragraph>
          <BulletList
            items={[
              "Encryption of data in transit (TLS/SSL)",
              "Secure data storage with Convex (SOC 2 compliant)",
              "Authentication via Clerk with optional multi-factor authentication",
              "Regular security assessments",
              "Employee access limitations",
            ]}
          />
          <Paragraph>
            However, no method of transmission over the Internet is 100% secure.
            While we strive to protect your data, we cannot guarantee absolute
            security.
          </Paragraph>
        </Section>

        <Section id="data-retention" title="7. Data Retention">
          <Paragraph>
            We retain your data for as long as your account is active or as
            needed to provide the Service:
          </Paragraph>
          <DataTable
            headers={["Data Type", "Retention Period"]}
            rows={[
              ["Active events", "Until you delete the event"],
              ["Deleted events", "Removed within 30 days"],
              ["Account data", "Until you delete your account"],
              ["Seating history", "Until you delete your account"],
              ["Email logs", "90 days after sending"],
            ]}
          />
          <Paragraph>
            Some data may be retained longer if required by law or for
            legitimate business purposes.
          </Paragraph>
        </Section>

        <Section id="your-rights" title="8. Your Rights">
          <Paragraph>
            Depending on your location, you may have the right to:
          </Paragraph>
          <BulletList
            items={[
              "Access the personal data we hold about you",
              "Correct inaccurate data",
              "Delete your data",
              "Export your data in a portable format",
              "Object to certain processing",
              "Withdraw consent",
            ]}
          />
          <Paragraph>
            To exercise these rights, contact us at{" "}
            <a
              href="mailto:privacy@seatherder.com"
              className="text-primary hover:underline"
            >
              privacy@seatherder.com
            </a>
            .
          </Paragraph>
        </Section>

        <Section id="international-transfers" title="9. International Transfers">
          <Paragraph>
            Your data may be transferred to and processed in countries other
            than your own. We ensure appropriate safeguards are in place for
            such transfers in compliance with applicable laws, including
            Standard Contractual Clauses where required.
          </Paragraph>
        </Section>

        <Section id="childrens-privacy" title="10. Children's Privacy">
          <Paragraph>
            The Service is not intended for children under 13. We do not
            knowingly collect personal information from children. If you believe
            we have collected data from a child, please contact us immediately.
          </Paragraph>
        </Section>

        <Section
          id="changes-to-this-policy"
          title="11. Changes to This Policy"
        >
          <Paragraph>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by posting a notice on the Service or
            sending you an email. Continued use of the Service after changes
            take effect constitutes acceptance of the updated policy.
          </Paragraph>
        </Section>

        <Section id="contact-us" title="12. Contact Us">
          <Paragraph>
            If you have questions about this Privacy Policy or our data
            practices, contact us:
          </Paragraph>
          <div className="grid sm:grid-cols-2 gap-4 my-6">
            <ContactCard icon={Mail} title="Privacy Inquiries">
              <a
                href="mailto:privacy@seatherder.com"
                className="text-primary hover:underline"
              >
                privacy@seatherder.com
              </a>
            </ContactCard>
            <ContactCard icon={Shield} title="Security Issues">
              <a
                href="mailto:security@seatherder.com"
                className="text-primary hover:underline"
              >
                security@seatherder.com
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
