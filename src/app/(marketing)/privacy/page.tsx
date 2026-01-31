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
            "Other Jurisdictions",
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
          <SubSection title="Information You Provide Directly">
            <Paragraph>When you create an account, we collect:</Paragraph>
            <BulletList
              items={[
                "Your name and email address",
                "Account credentials (managed securely through our authentication provider, Clerk)",
                "Optional profile information (phone number, organization name)",
                "Payment information (processed securely by our payment provider, Stripe)",
              ]}
            />
          </SubSection>

          <SubSection title="Event and Guest Data">
            <Paragraph>
              When you use the Service to manage events, we store:
            </Paragraph>
            <BulletList
              items={[
                "Event details (name, date, settings, theme preferences, custom terminology)",
                "Guest information you provide (names, emails, phone numbers, dietary restrictions, seating preferences)",
                "Guest attributes for matching (department, interests, job level, goals, custom tags)",
                "Seating assignments, check-in records, and QR code identifiers",
                "Communication logs (emails sent through the Service)",
                "Seating history for cross-event optimization",
                "Breakout room and session assignments",
              ]}
            />
          </SubSection>

          <SubSection title="Automatically Collected Information">
            <Paragraph>
              We automatically collect certain information when you use the
              Service:
            </Paragraph>
            <BulletList
              items={[
                "Device and browser information (type, version, operating system)",
                "IP address and general geographic location",
                "Usage logs (pages viewed, features accessed, session duration)",
                "Cookies and similar tracking technologies (see Section 9)",
                "Error reports and performance data",
              ]}
            />
          </SubSection>

          <SubSection title="Information from Third Parties">
            <Paragraph>We may receive information from:</Paragraph>
            <BulletList
              items={[
                "Authentication providers (Clerk) when you sign in",
                "Payment processors (Stripe) for transaction verification",
                "Analytics services for aggregated usage patterns",
              ]}
            />
          </SubSection>

          <SubSection title="Sensitive Information">
            <Paragraph>
              Guest data you upload may contain sensitive information such as:
            </Paragraph>
            <BulletList
              items={[
                "Dietary restrictions that may reveal health conditions or religious beliefs",
                "Contact information (phone numbers, email addresses)",
                "Organizational hierarchy information (job levels, departments)",
                "VIP status or special accommodation needs",
              ]}
            />
            <ImportantNotice variant="info">
              You are responsible for ensuring you have appropriate consent from
              guests before uploading their personal information. Consider
              limiting the data you collect to what is necessary for your event.
            </ImportantNotice>
          </SubSection>
        </Section>

        <Section
          id="how-we-use-your-information"
          title="2. How We Use Your Information"
        >
          <SubSection title="Service Delivery">
            <Paragraph>
              We use your information to provide and improve the Service:
            </Paragraph>
            <BulletList
              items={[
                "Account creation, management, and authentication",
                "Processing subscriptions and payments",
                "Generating intelligent seating arrangements using our matching algorithm",
                "Enabling QR code check-in and real-time event management",
                "Sending emails on your behalf to guests (invitations, confirmations, reminders)",
                "Providing customer support and responding to inquiries",
                "Personalizing your experience based on preferences",
              ]}
            />
          </SubSection>

          <SubSection title="Communications">
            <Paragraph>We may communicate with you for:</Paragraph>
            <BulletList
              items={[
                "Transactional emails (account verification, password resets, payment confirmations)",
                "Service updates and important notices about changes to the Service",
                "Responses to your support requests and feedback",
                "Optional marketing communications (only with your consent, which you can withdraw anytime)",
              ]}
            />
          </SubSection>

          <SubSection title="Security and Compliance">
            <Paragraph>
              We process information to maintain security and meet legal
              obligations:
            </Paragraph>
            <BulletList
              items={[
                "Detecting and preventing fraud, abuse, and unauthorized access",
                "Monitoring for security threats and vulnerabilities",
                "Complying with applicable laws, regulations, and legal processes",
                "Enforcing our Terms of Service and protecting our legal rights",
              ]}
            />
          </SubSection>

          <SubSection title="Research and Improvement">
            <Paragraph>
              We use aggregated and anonymized data to improve the Service:
            </Paragraph>
            <BulletList
              items={[
                "Developing new features and functionality",
                "Improving our matching algorithm using anonymized patterns",
                "Analyzing usage trends and service performance",
                "Conducting internal research and testing",
              ]}
            />
          </SubSection>

          <ImportantNotice variant="info">
            We do NOT sell your personal information to third parties. We do not
            use guest data for marketing purposes. Guest data is processed
            solely to provide the Service on your behalf.
          </ImportantNotice>
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
            arrangements. This section explains how our algorithm works, its
            limitations, and your rights regarding automated processing.
          </Paragraph>

          <SubSection title="How Our Algorithm Works">
            <BulletList
              items={[
                "Our matching algorithm analyzes guest attributes (department, interests, job level, goals) to calculate compatibility scores",
                "The algorithm considers your configured weights and constraints to optimize table assignments",
                "Cross-event seating history is used to encourage new connections based on your novelty preference",
                "Constraint satisfaction (pin, repel, attract) takes priority in all calculations",
                "Multi-round seating uses repeat avoidance to prevent same tablemates across rounds",
              ]}
            />
          </SubSection>

          <SubSection title="Important Limitations">
            <Paragraph>
              You should be aware of the following limitations of our automated
              processing:
            </Paragraph>
            <BulletList
              items={[
                "Seating suggestions are algorithmic recommendations, not guarantees of guest compatibility",
                "The algorithm cannot account for factors not captured in guest data (personal relationships, recent conflicts, etc.)",
                "Compatibility scores are based on attribute matching, not actual interpersonal dynamics",
                "The algorithm may produce suboptimal results with incomplete or inaccurate guest data",
                "No automated decisions are made that produce legal or similarly significant effects",
              ]}
            />
          </SubSection>

          <SubSection title="Your Rights Regarding Automated Processing">
            <Paragraph>
              You have the following rights concerning our automated processing:
            </Paragraph>
            <BulletList
              items={[
                <>
                  <Strong>Manual Override:</Strong> You can always manually
                  adjust any seating assignment through the drag-and-drop editor
                </>,
                <>
                  <Strong>Preview Before Commit:</Strong> You can preview
                  algorithmic suggestions before applying them to your event
                </>,
                <>
                  <Strong>Configure Weights:</Strong> You control how the
                  algorithm prioritizes different factors through the matching
                  configuration wizard
                </>,
                <>
                  <Strong>Opt-Out:</Strong> You can choose not to use the
                  automated seating feature and manually assign all guests
                </>,
                <>
                  <Strong>Challenge Results:</Strong> Contact us if you believe
                  the algorithm produced incorrect or unfair results
                </>,
              ]}
            />
          </SubSection>

          <ImportantNotice variant="info">
            The algorithm is a tool to assist your decision-making, not replace
            it. You retain full control over all final seating assignments, and
            we encourage you to review and adjust suggestions based on your
            knowledge of your guests.
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
            We implement comprehensive security measures to protect your data
            across our infrastructure.
          </Paragraph>

          <SubSection title="Infrastructure Security">
            <BulletList
              items={[
                "Backend database hosted on Convex with SOC 2 Type II compliance",
                "Cloud infrastructure with geographic redundancy",
                "24/7 system monitoring and alerting",
                "Regular security audits and compliance certifications",
              ]}
            />
          </SubSection>

          <SubSection title="Technical Safeguards">
            <BulletList
              items={[
                "TLS 1.3+ encryption for all data in transit",
                "AES-256 encryption for data at rest",
                "Secure password hashing using bcrypt with salt",
                "Multi-factor authentication available through Clerk",
                "API rate limiting to prevent abuse",
                "Automated malware and vulnerability scanning",
              ]}
            />
          </SubSection>

          <SubSection title="Organizational Controls">
            <BulletList
              items={[
                "Role-based access controls limiting data access to authorized personnel",
                "Employee background checks and security training",
                "Confidentiality agreements for all team members",
                "Documented incident response procedures",
                "Regular penetration testing and security assessments",
              ]}
            />
          </SubSection>

          <SubSection title="Your Responsibilities">
            <Paragraph>
              Security is a shared responsibility. You can help protect your
              account by:
            </Paragraph>
            <BulletList
              items={[
                "Using a strong, unique password for your account",
                "Enabling multi-factor authentication when available",
                "Keeping your login credentials confidential",
                "Logging out when using shared devices",
                "Promptly reporting any suspicious activity to security@seatherder.com",
              ]}
            />
          </SubSection>

          <ImportantNotice variant="warning">
            No method of transmission over the Internet or electronic storage is
            100% secure. While we strive to protect your data using
            commercially acceptable means, we cannot guarantee absolute
            security. You acknowledge that you provide information at your own
            risk.
          </ImportantNotice>
        </Section>

        <Section id="data-retention" title="8. Data Retention">
          <Paragraph>
            We retain your data for as long as your account is active or as
            needed to provide the Service. Below are our standard retention
            periods:
          </Paragraph>
          <DataTable
            headers={["Data Type", "Retention Period"]}
            rows={[
              [
                "Account information",
                "Duration of account plus 90 days after closure",
              ],
              ["Active events", "Until you delete the event"],
              [
                "Deleted events",
                "Removed within 30 days of deletion request",
              ],
              [
                "Guest data",
                "Until event deletion or 30 days after account closure",
              ],
              [
                "Seating history",
                "Until you delete your account (used for cross-event optimization)",
              ],
              ["Email logs", "90 days after sending"],
              ["Support communications", "2 years after resolution"],
              [
                "Payment records",
                "7 years (required for tax and accounting purposes)",
              ],
              [
                "Usage analytics (detailed)",
                "90 days, then aggregated indefinitely",
              ],
            ]}
          />

          <SubSection title="Account Deletion">
            <Paragraph>
              You can delete your account at any time through your account
              settings. Upon deletion:
            </Paragraph>
            <BulletList
              items={[
                "Your account will be deactivated within 24-48 hours",
                "Personal data will be deleted within 30 days",
                "Some data may be retained in anonymized form for analytics",
                "Backup copies may persist for up to 90 days before automatic removal",
                "Data required for legal compliance may be retained longer as required by law",
              ]}
            />
          </SubSection>

          <Paragraph>
            If you need data deleted sooner for legal or personal reasons,
            contact us at{" "}
            <a
              href="mailto:privacy@seatherder.com"
              className="text-primary hover:underline"
            >
              privacy@seatherder.com
            </a>{" "}
            and we will work to accommodate your request where possible.
          </Paragraph>
        </Section>

        <Section id="cookies-and-tracking" title="9. Cookies and Tracking">
          <Paragraph>
            We use cookies and similar tracking technologies to enhance your
            experience, maintain security, and improve our Service.
          </Paragraph>

          <SubSection title="Types of Cookies We Use">
            <DataTable
              headers={["Cookie Type", "Purpose", "Required"]}
              rows={[
                [
                  "Essential",
                  "Authentication, security, session management, CSRF protection",
                  "Yes",
                ],
                [
                  "Functional",
                  "Remember preferences, UI state, language settings, theme choices",
                  "No",
                ],
                [
                  "Analytics",
                  "Usage statistics, performance metrics, feature adoption tracking",
                  "No",
                ],
              ]}
            />
          </SubSection>

          <SubSection title="Managing Cookies">
            <Paragraph>
              You can control cookies through your browser settings:
            </Paragraph>
            <BulletList
              items={[
                "Most browsers allow you to refuse or delete cookies",
                "You can set preferences for specific websites",
                "Private/incognito browsing limits cookie persistence",
                "Disabling essential cookies may prevent you from using the Service",
              ]}
            />
          </SubSection>

          <SubSection title="Do Not Track">
            <Paragraph>
              Some browsers include a &quot;Do Not Track&quot; (DNT) feature
              that signals to websites that you do not want to be tracked. There
              is currently no industry standard for how companies should respond
              to DNT signals. At this time, our Service does not respond to DNT
              signals. However, you can manage your privacy preferences through
              cookie settings as described above.
            </Paragraph>
          </SubSection>

          <SubSection title="Third-Party Cookies">
            <Paragraph>
              Our service providers (Clerk for authentication, Stripe for
              payments) may set their own cookies. These cookies are governed by
              their respective privacy policies. We do not control third-party
              cookies and recommend reviewing their privacy policies for more
              information.
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
                <Strong>Right of Access (Article 15):</Strong> Obtain
                confirmation of whether we process your personal data and
                receive a copy of that data
              </>,
              <>
                <Strong>Right to Rectification (Article 16):</Strong> Have
                inaccurate personal data corrected without undue delay
              </>,
              <>
                <Strong>Right to Erasure (Article 17):</Strong> Request deletion
                of your personal data (&quot;right to be forgotten&quot;) in
                certain circumstances
              </>,
              <>
                <Strong>Right to Restriction (Article 18):</Strong> Request
                restriction of processing while we verify accuracy or assess
                your objection
              </>,
              <>
                <Strong>Right to Data Portability (Article 20):</Strong> Receive
                your personal data in a structured, commonly used,
                machine-readable format and transmit it to another controller
              </>,
              <>
                <Strong>Right to Object (Article 21):</Strong> Object to
                processing based on legitimate interests, direct marketing, or
                research purposes
              </>,
              <>
                <Strong>Right to Withdraw Consent (Article 7):</Strong> Withdraw
                consent at any time where processing is based on consent,
                without affecting prior lawful processing
              </>,
              <>
                <Strong>Automated Decision-Making (Article 22):</Strong> Not be
                subject to decisions based solely on automated processing that
                produce legal or similarly significant effects
              </>,
            ]}
          />

          <SubSection title="Supervisory Authorities">
            <Paragraph>
              You have the right to lodge a complaint with your local data
              protection authority (Article 77):
            </Paragraph>
            <BulletList
              items={[
                <>
                  <Strong>EEA:</Strong> European Data Protection Board (EDPB) -
                  edpb.europa.eu - maintains a list of all national supervisory
                  authorities
                </>,
                <>
                  <Strong>United Kingdom:</Strong> Information
                  Commissioner&apos;s Office (ICO) - ico.org.uk
                </>,
                <>
                  <Strong>Switzerland:</Strong> Federal Data Protection and
                  Information Commissioner (FDPIC) - edoeb.admin.ch
                </>,
              ]}
            />
          </SubSection>

          <Paragraph>
            To exercise any of these rights, contact us at{" "}
            <a
              href="mailto:privacy@seatherder.com"
              className="text-primary hover:underline"
            >
              privacy@seatherder.com
            </a>
            . We will respond to your request within one month, which may be
            extended by two additional months for complex requests.
          </Paragraph>
        </Section>

        <Section id="other-jurisdictions" title="13. Other Jurisdictions">
          <Paragraph>
            We are committed to complying with privacy laws in the jurisdictions
            where we operate. In addition to GDPR and CCPA/CPRA, we recognize
            the following privacy frameworks:
          </Paragraph>
          <BulletList
            items={[
              <>
                <Strong>Canada (PIPEDA):</Strong> The Personal Information
                Protection and Electronic Documents Act provides Canadians with
                rights to access, correct, and challenge the handling of their
                personal information. Contact the Office of the Privacy
                Commissioner of Canada (priv.gc.ca) for complaints.
              </>,
              <>
                <Strong>Brazil (LGPD):</Strong> The Lei Geral de Proteção de
                Dados provides Brazilian residents with rights similar to GDPR,
                including access, correction, deletion, and portability. Contact
                the Autoridade Nacional de Proteção de Dados (ANPD) for
                complaints.
              </>,
              <>
                <Strong>Australia (Privacy Act):</Strong> The Australian Privacy
                Principles (APPs) govern how we handle personal information of
                Australian residents. Contact the Office of the Australian
                Information Commissioner (OAIC) for complaints.
              </>,
              <>
                <Strong>Japan (APPI):</Strong> The Act on the Protection of
                Personal Information provides Japanese residents with rights to
                disclosure, correction, and cessation of use. Contact the
                Personal Information Protection Commission for complaints.
              </>,
              <>
                <Strong>Singapore (PDPA):</Strong> The Personal Data Protection
                Act provides Singapore residents with rights to access and
                correct their personal data. Contact the Personal Data
                Protection Commission for complaints.
              </>,
            ]}
          />
          <Paragraph>
            If you are located in a jurisdiction with specific privacy laws not
            listed above, please contact us at{" "}
            <a
              href="mailto:privacy@seatherder.com"
              className="text-primary hover:underline"
            >
              privacy@seatherder.com
            </a>{" "}
            and we will work to address your specific requirements.
          </Paragraph>
        </Section>

        <Section
          id="international-transfers"
          title="14. International Transfers"
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
          title="15. Security Breach Notification"
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

        <Section id="childrens-privacy" title="16. Children's Privacy">
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
          title="17. Changes to This Policy"
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

        <Section id="dispute-resolution" title="18. Dispute Resolution">
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

        <Section id="contact-us" title="19. Contact Us">
          <Paragraph>
            If you have questions about this Privacy Policy or our data
            practices, please contact us through any of the following channels:
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
          <SubSection title="Additional Contact Methods">
            <BulletList
              items={[
                <>
                  <Strong>General Support:</Strong>{" "}
                  <a
                    href="mailto:support@seatherder.com"
                    className="text-primary hover:underline"
                  >
                    support@seatherder.com
                  </a>
                </>,
                <>
                  <Strong>Legal Inquiries:</Strong>{" "}
                  <a
                    href="mailto:legal@seatherder.com"
                    className="text-primary hover:underline"
                  >
                    legal@seatherder.com
                  </a>
                </>,
              ]}
            />
          </SubSection>
          <SubSection title="Response Times">
            <Paragraph>
              We strive to respond to all inquiries within the following
              timeframes:
            </Paragraph>
            <BulletList
              items={[
                "Privacy requests: Acknowledgment within 5-10 business days, substantive response within 30-45 days",
                "Security issues: Acknowledgment within 24 hours for potential vulnerabilities",
                "General support: Response within 2-3 business days",
              ]}
            />
          </SubSection>
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
