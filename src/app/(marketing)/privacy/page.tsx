import { ArrowLeft, Mail, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";

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
            "AI & Automated Processing",
            "GDPR Legal Basis",
            "Data Sharing",
            "Data Security",
            "Data Retention",
            "Cookies and Tracking",
            "Your Rights",
            "California Privacy Rights",
            "EU Privacy Rights",
            "International Transfers",
            "Security Breach Notification",
            "Children's Privacy",
            "Changes to This Policy",
            "Dispute Resolution",
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

        <Section
          id="ai-and-automated-processing"
          title="4. AI & Automated Processing"
        >
          <Paragraph>
            Seatherder uses automated processing to provide intelligent seating
            arrangements:
          </Paragraph>
          <SubSection title="How Our Algorithm Works">
            <BulletList
              items={[
                "Our matching algorithm analyzes guest attributes (department, interests, job level, goals) to calculate compatibility scores",
                "The algorithm considers your configured weights and constraints to optimize table assignments",
                "Cross-event seating history is used to encourage new connections based on your novelty preference",
                "Constraint satisfaction (pin, repel, attract) takes priority in all calculations",
              ]}
            />
          </SubSection>
          <SubSection title="Important Limitations">
            <BulletList
              items={[
                "Seating suggestions are algorithmic recommendations, not guarantees of guest compatibility",
                "The algorithm cannot account for factors not captured in guest data",
                "You retain full control to override any automated assignments",
                "No automated decisions are made that produce legal or similarly significant effects",
              ]}
            />
          </SubSection>
          <ImportantNotice variant="info">
            You can always manually adjust seating assignments after the
            algorithm runs. The algorithm is a tool to assist your
            decision-making, not replace it.
          </ImportantNotice>
        </Section>

        <Section id="gdpr-legal-basis" title="5. GDPR Legal Basis">
          <Paragraph>
            For users in the European Economic Area (EEA), UK, and Switzerland,
            we process personal data under the following legal bases:
          </Paragraph>
          <DataTable
            headers={["Processing Activity", "Legal Basis"]}
            rows={[
              [
                "Account management and service delivery",
                "Contractual necessity",
              ],
              [
                "Seating algorithm and event management",
                "Contractual necessity",
              ],
              ["Security monitoring and fraud prevention", "Legitimate interest"],
              ["Service improvement and analytics", "Legitimate interest"],
              ["Legal compliance and record keeping", "Legal obligation"],
              ["Marketing communications", "Consent (where required)"],
            ]}
          />
          <Paragraph>
            Where we rely on legitimate interests, we have conducted balancing
            tests to ensure our interests do not override your fundamental
            rights and freedoms.
          </Paragraph>
        </Section>

        <Section id="data-sharing" title="6. Data Sharing">
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

        <Section id="data-security" title="7. Data Security">
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

        <Section id="data-retention" title="8. Data Retention">
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

        <Section id="cookies-and-tracking" title="9. Cookies and Tracking">
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
                ["Preference cookies", "Remember your settings and choices"],
              ]}
            />
            <Paragraph>
              You can control cookies through your browser settings. Note that
              disabling cookies may affect the functionality of the Service.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="your-rights" title="10. Your Rights">
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
            . We will acknowledge your request within 5-10 business days and
            provide a substantive response within 30-45 days.
          </Paragraph>
        </Section>

        <Section
          id="california-privacy-rights"
          title="11. California Privacy Rights"
        >
          <Paragraph>
            If you are a California resident, the California Consumer Privacy
            Act (CCPA) and California Privacy Rights Act (CPRA) provide you with
            specific rights:
          </Paragraph>
          <BulletList
            items={[
              <>
                <Strong>Right to Know:</Strong> You can request information
                about the categories and specific pieces of personal information
                we have collected about you
              </>,
              <>
                <Strong>Right to Delete:</Strong> You can request deletion of
                your personal information, subject to certain exceptions
              </>,
              <>
                <Strong>Right to Correct:</Strong> You can request correction of
                inaccurate personal information
              </>,
              <>
                <Strong>Right to Opt-Out:</Strong> You can opt out of the sale
                or sharing of your personal information
              </>,
              <>
                <Strong>Non-Discrimination:</Strong> We will not discriminate
                against you for exercising your privacy rights
              </>,
            ]}
          />
          <ImportantNotice variant="info">
            Seatherder does not sell personal information for monetary
            consideration nor do we share personal information for cross-context
            behavioral advertising purposes.
          </ImportantNotice>
        </Section>

        <Section id="eu-privacy-rights" title="12. EU Privacy Rights">
          <Paragraph>
            If you are located in the European Economic Area (EEA), United
            Kingdom, or Switzerland, you have additional rights under the
            General Data Protection Regulation (GDPR):
          </Paragraph>
          <BulletList
            items={[
              <>
                <Strong>Right of Access:</Strong> Obtain confirmation of whether
                we process your personal data and receive a copy
              </>,
              <>
                <Strong>Right to Rectification:</Strong> Have inaccurate
                personal data corrected without undue delay
              </>,
              <>
                <Strong>Right to Erasure:</Strong> Request deletion of your
                personal data in certain circumstances
              </>,
              <>
                <Strong>Right to Restriction:</Strong> Request restriction of
                processing in certain circumstances
              </>,
              <>
                <Strong>Right to Data Portability:</Strong> Receive your
                personal data in a structured, commonly used, machine-readable
                format
              </>,
              <>
                <Strong>Right to Object:</Strong> Object to processing based on
                legitimate interests, direct marketing, or research purposes
              </>,
              <>
                <Strong>Automated Decision-Making:</Strong> Not be subject to
                decisions based solely on automated processing that produce
                legal or similarly significant effects
              </>,
            ]}
          />
          <Paragraph>
            You also have the right to lodge a complaint with your local data
            protection authority. A list of EEA data protection authorities is
            available at the European Data Protection Board website.
          </Paragraph>
        </Section>

        <Section
          id="international-transfers"
          title="13. International Transfers"
        >
          <Paragraph>
            Your data may be transferred to and processed in countries other
            than your own, including the United States where our service
            providers operate. We ensure appropriate safeguards are in place for
            such transfers in compliance with applicable laws, including:
          </Paragraph>
          <BulletList
            items={[
              "Standard Contractual Clauses approved by the European Commission",
              "Encryption of data in transit and at rest",
              "Contractual commitments from our service providers to protect your data",
            ]}
          />
        </Section>

        <Section
          id="security-breach-notification"
          title="14. Security Breach Notification"
        >
          <Paragraph>
            In the event of a security breach involving your personal
            information that creates a risk of identity theft or fraud, we will:
          </Paragraph>
          <BulletList
            items={[
              "Notify affected users promptly via email and/or prominent notice on the Service",
              "Describe the nature of the incident and types of data affected",
              "Explain the steps we are taking to address the breach",
              "Provide guidance on protective measures you can take",
              "Report to relevant authorities as required by applicable law",
            ]}
          />
        </Section>

        <Section id="childrens-privacy" title="15. Children's Privacy">
          <Paragraph>
            The Service is not intended for children under 18 years of age. We
            do not knowingly collect personal information from children. If we
            become aware that we have collected personal data from a person
            under 18, we will take steps to delete that information promptly. If
            you believe we have collected data from a child, please contact us
            immediately at{" "}
            <a
              href="mailto:privacy@seatherder.com"
              className="text-primary hover:underline"
            >
              privacy@seatherder.com
            </a>
            .
          </Paragraph>
        </Section>

        <Section
          id="changes-to-this-policy"
          title="16. Changes to This Policy"
        >
          <Paragraph>
            We may update this Privacy Policy from time to time. For material
            changes, we will provide at least 30 days advance notice by posting
            a prominent notice on the Service or sending you an email. Continued
            use of the Service after changes take effect constitutes acceptance
            of the updated policy. We encourage you to review this policy
            periodically.
          </Paragraph>
        </Section>

        <Section id="dispute-resolution" title="17. Dispute Resolution">
          <Paragraph>
            If you have concerns about our privacy practices, we encourage you
            to contact us first to seek resolution:
          </Paragraph>
          <BulletList
            items={[
              <>
                <Strong>Informal Resolution:</Strong> Contact us at{" "}
                <a
                  href="mailto:privacy@seatherder.com"
                  className="text-primary hover:underline"
                >
                  privacy@seatherder.com
                </a>{" "}
                and we will work to address your concerns
              </>,
              <>
                <Strong>Response Time:</Strong> We aim to respond to privacy
                inquiries within 5-10 business days
              </>,
              <>
                <Strong>Regulatory Complaints:</Strong> If we cannot resolve
                your concern, you may file a complaint with your local data
                protection authority
              </>,
            ]}
          />
        </Section>

        <Section id="contact-us" title="18. Contact Us">
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
