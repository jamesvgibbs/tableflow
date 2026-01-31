import { ArrowLeft, Mail, MapPin } from "lucide-react";
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
          <p className="text-muted-foreground">Last updated: January 2026</p>
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
            "User Eligibility and Accounts",
            "User Responsibilities and Conduct",
            "Guest Data and Privacy",
            "Subscription, Payment, and Billing",
            "Intellectual Property",
            "User-Generated Content",
            "Disclaimers",
            "Limitation of Liability",
            "Indemnification",
            "Arbitration and Dispute Resolution",
            "Class Action Waiver",
            "Governing Law and Jurisdiction",
            "Termination",
            "Modifications to Terms and Service",
            "Severability",
            "Entire Agreement",
            "Additional Provisions",
            "Contact Information",
            "Acknowledgment and Acceptance",
          ]}
        />

        <Divider />

        <Section id="agreement-to-terms" title="1. Agreement to Terms">
          <Paragraph>
            By accessing or using Seatherder (&quot;the Service&quot;), you
            agree to be bound by these Terms of Service (&quot;Terms&quot;).
            These Terms constitute a legally binding agreement between you and
            Seatherder (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
          </Paragraph>
          <Paragraph>
            We reserve the right to modify these Terms at any time. Changes take
            effect immediately upon posting. Your continued use of the Service
            after any modifications constitutes acceptance of the updated Terms.
          </Paragraph>
          <Paragraph>
            Additional terms may apply to specific features or services. Such
            additional terms will be presented to you when you access those
            features and are incorporated into these Terms by reference.
          </Paragraph>
        </Section>

        <Section id="description-of-service" title="2. Description of Service">
          <Paragraph>
            Seatherder is an event seating management platform that helps
            organizers create intelligent seating arrangements for their events.
            The Service is provided solely as an organizational tool and does
            not guarantee specific outcomes for your events.
          </Paragraph>
          <Paragraph>The Service includes features such as:</Paragraph>
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
          <ImportantNotice variant="info">
            The Service is an organizational tool only. We do not provide event
            planning advice, guarantee guest satisfaction, or ensure that
            seating arrangements will meet your specific expectations. You are
            solely responsible for reviewing and approving all seating
            assignments before your event.
          </ImportantNotice>
        </Section>

        <Section
          id="user-eligibility-and-accounts"
          title="3. User Eligibility and Accounts"
        >
          <SubSection title="Eligibility">
            <Paragraph>
              You must be at least 18 years old to use the Service. By creating
              an account, you represent and warrant that you meet this age
              requirement and have the legal capacity to enter into these Terms.
            </Paragraph>
          </SubSection>

          <SubSection title="Account Requirements">
            <Paragraph>
              To use certain features of the Service, you must create an
              account. When creating an account, you agree to:
            </Paragraph>
            <BulletList
              items={[
                "Provide accurate, current, and complete information",
                "Maintain and promptly update your account information",
                "Maintain the confidentiality of your login credentials",
                "Accept responsibility for all activities under your account",
                "Notify us immediately of any unauthorized access or security breach",
              ]}
            />
          </SubSection>

          <SubSection title="Account Restrictions">
            <Paragraph>
              You may not create an account using false or misleading
              information, create multiple accounts without our permission, or
              create an account on behalf of another person without their
              authorization.
            </Paragraph>
          </SubSection>
        </Section>

        <Section
          id="user-responsibilities-and-conduct"
          title="4. User Responsibilities and Conduct"
        >
          <Paragraph>
            You agree to use the Service only for lawful purposes and in
            accordance with these Terms. You are solely responsible for your
            conduct and any data, text, or content you submit through the
            Service.
          </Paragraph>

          <SubSection title="Prohibited Activities">
            <Paragraph>You may not:</Paragraph>
            <BulletList
              items={[
                "Violate any applicable laws, regulations, or third-party rights",
                "Use the Service for any fraudulent, harassing, or abusive purpose",
                "Use automated scripts, bots, or scrapers to access the Service without permission",
                "Attempt to gain unauthorized access to the Service, other accounts, or computer systems",
                "Introduce viruses, malware, or other harmful code",
                "Interfere with or disrupt the Service or its infrastructure",
                "Use the Service to send spam or unsolicited communications",
                "Reverse engineer, decompile, or attempt to extract the source code of the Service",
                "Remove, alter, or obscure any proprietary notices or labels",
                "Use the Service for any commercial purpose not expressly permitted",
              ]}
            />
          </SubSection>

          <SubSection title="Email Communications">
            <Paragraph>
              When using the email features of the Service, you agree to comply
              with all applicable anti-spam laws (including CAN-SPAM and GDPR).
              You are solely responsible for obtaining proper consent from
              recipients and for the content of your communications.
            </Paragraph>
          </SubSection>
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
          id="subscription-payment-and-billing"
          title="6. Subscription, Payment, and Billing"
        >
          <SubSection title="Payment Processing">
            <Paragraph>
              All payments are processed through Stripe or other third-party
              payment processors. By providing payment information, you agree to
              abide by the payment processor&apos;s terms of service. We do not
              store your full credit card information on our servers.
            </Paragraph>
          </SubSection>

          <SubSection title="Subscription Plans">
            <Paragraph>
              Some features of the Service require a paid subscription. By
              subscribing, you agree to:
            </Paragraph>
            <BulletList
              items={[
                "Pay the applicable fees as described at the time of purchase",
                "Provide accurate and complete billing information",
                "Authorize us to charge your payment method for recurring fees",
                "Keep your payment information current",
              ]}
            />
          </SubSection>

          <SubSection title="Automatic Renewal">
            <Paragraph>
              Subscriptions renew automatically at the end of each billing cycle
              unless cancelled before the renewal date. You will be charged the
              then-current subscription price plus applicable taxes.
            </Paragraph>
          </SubSection>

          <SubSection title="Price Changes">
            <Paragraph>
              We may change subscription prices with at least 30 days&apos;
              advance notice. Price changes will take effect at the start of
              your next billing cycle following the notice period. Your
              continued use after a price change constitutes acceptance of the
              new price.
            </Paragraph>
          </SubSection>

          <SubSection title="Refunds">
            <Paragraph>
              Subscription fees are generally non-refundable. However, we may
              provide refunds at our discretion for:
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
              billing period. You retain access to paid features until then. No
              refunds are provided for partial billing periods.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="intellectual-property" title="7. Intellectual Property">
          <SubSection title="Our Intellectual Property">
            <Paragraph>
              The Service, including its design, features, software, graphics,
              text, and content created by us, is protected by copyright,
              trademark, and other intellectual property laws. All rights,
              title, and interest in and to the Service remain with Seatherder.
            </Paragraph>
          </SubSection>

          <SubSection title="Limited License">
            <Paragraph>
              We grant you a limited, non-exclusive, non-transferable,
              non-sublicensable license to access and use the Service for your
              personal or internal business purposes, subject to these Terms.
              This license does not include the right to:
            </Paragraph>
            <BulletList
              items={[
                "Copy, modify, or create derivative works of the Service",
                "Resell, sublicense, or redistribute the Service",
                "Use the Service for any commercial purpose not expressly authorized",
                "Remove or alter any proprietary notices or branding",
              ]}
            />
          </SubSection>

          <SubSection title="Feedback">
            <Paragraph>
              If you provide us with feedback, suggestions, or ideas regarding
              the Service, you grant us an unlimited, irrevocable, perpetual,
              royalty-free license to use such feedback for any purpose without
              compensation or attribution to you.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="user-generated-content" title="8. User-Generated Content">
          <SubSection title="Your Content">
            <Paragraph>
              You retain ownership of the content you upload to the Service,
              including guest lists, event data, and communications. By
              uploading content, you grant us a limited license to use, store,
              and process your content solely for the purpose of providing and
              improving the Service.
            </Paragraph>
          </SubSection>

          <SubSection title="License Grant">
            <Paragraph>
              The license you grant us includes the right to store, process,
              display, and transmit your content as necessary to operate the
              Service. This license terminates when you delete your content or
              account, except for content that has been shared with or copied by
              others.
            </Paragraph>
          </SubSection>

          <SubSection title="Content Responsibility">
            <Paragraph>
              You are solely responsible for the content you upload. You
              represent and warrant that you have all necessary rights to upload
              such content and that your content does not violate any laws or
              third-party rights.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="disclaimers" title="9. Disclaimers">
          <ImportantNotice>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT.
          </ImportantNotice>
          <Paragraph>We do not warrant that:</Paragraph>
          <BulletList
            items={[
              "The Service will be uninterrupted, secure, or error-free",
              "The seating algorithm will produce optimal results for every situation",
              "Any errors or defects will be corrected",
              "The Service will meet your specific requirements or expectations",
              "The results obtained from using the Service will be accurate or reliable",
            ]}
          />
          <Paragraph>
            The Service is a tool to assist with event planning, not a guarantee
            of successful events. You are solely responsible for reviewing and
            approving all seating arrangements.
          </Paragraph>
        </Section>

        <Section
          id="limitation-of-liability"
          title="10. Limitation of Liability"
        >
          <ImportantNotice>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SEATHERDER SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
          </ImportantNotice>
          <BulletList
            items={[
              "Loss of profits, revenue, or business opportunities",
              "Loss of data or content",
              "Event cancellations or disruptions",
              "Guest dissatisfaction or complaints",
              "Reputational harm",
              "Any damages arising from your reliance on the Service",
            ]}
          />
          <ImportantNotice>
            OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM YOUR USE OF THE
            SERVICE SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID TO
            US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED
            DOLLARS ($100).
          </ImportantNotice>
          <Paragraph>
            These limitations apply regardless of the legal theory upon which
            the claim is based, whether we have been advised of the possibility
            of such damages, and even if any limited remedy fails of its
            essential purpose.
          </Paragraph>
        </Section>

        <Section id="indemnification" title="11. Indemnification">
          <Paragraph>
            You agree to indemnify, defend, and hold harmless Seatherder and its
            officers, directors, employees, agents, affiliates, and licensors
            from and against any claims, liabilities, damages, judgments,
            awards, losses, costs, expenses, or fees (including reasonable
            attorneys&apos; fees) arising out of or relating to:
          </Paragraph>
          <NumberedList
            items={[
              "Your use or misuse of the Service",
              "Your violation of these Terms",
              "Your violation of any applicable law or regulation",
              "Your violation of any third-party rights, including privacy or intellectual property rights",
              "Content you upload to the Service",
              "Your failure to obtain proper consent from guests or event attendees",
              "Any decisions you make based on information from the Service",
            ]}
          />
        </Section>

        <Section
          id="arbitration-and-dispute-resolution"
          title="12. Arbitration and Dispute Resolution"
        >
          <SubSection title="Binding Arbitration">
            <Paragraph>
              Except as otherwise provided herein, any dispute, controversy, or
              claim arising out of or relating to these Terms or the Service
              shall be resolved by binding individual arbitration rather than in
              court. This includes claims that arose before these Terms.
            </Paragraph>
          </SubSection>

          <SubSection title="Arbitration Procedures">
            <Paragraph>
              The arbitration shall be administered by the American Arbitration
              Association (&quot;AAA&quot;) under its Consumer Arbitration Rules
              or by another mutually agreed arbitration provider. The
              arbitrator&apos;s decision shall be final and binding.
            </Paragraph>
          </SubSection>

          <SubSection title="Exceptions">
            <Paragraph>
              Either party may bring claims in small claims court if the claim
              qualifies. Either party may seek injunctive or other equitable
              relief in any court of competent jurisdiction for infringement or
              misappropriation of intellectual property rights.
            </Paragraph>
          </SubSection>

          <SubSection title="Opt-Out">
            <Paragraph>
              You may opt out of this arbitration agreement by sending written
              notice to us within 30 days of first accepting these Terms. The
              notice must include your name, address, and a clear statement that
              you wish to opt out.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="class-action-waiver" title="13. Class Action Waiver">
          <ImportantNotice>
            YOU AND SEATHERDER AGREE THAT EACH MAY BRING CLAIMS AGAINST THE
            OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A
            PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR
            REPRESENTATIVE PROCEEDING.
          </ImportantNotice>
          <Paragraph>
            Unless both you and Seatherder agree otherwise, the arbitrator may
            not consolidate more than one person&apos;s claims, and may not
            otherwise preside over any form of a representative or class
            proceeding.
          </Paragraph>
        </Section>

        <Section
          id="governing-law-and-jurisdiction"
          title="14. Governing Law and Jurisdiction"
        >
          <Paragraph>
            These Terms and any dispute arising out of or related to them or the
            Service shall be governed by the laws of the State of Delaware,
            United States, without regard to its conflict of law provisions.
          </Paragraph>
          <Paragraph>
            For any claims not subject to arbitration, you agree to submit to
            the personal and exclusive jurisdiction of the state and federal
            courts located in Delaware.
          </Paragraph>
          <ImportantNotice variant="info">
            TO THE EXTENT PERMITTED BY LAW, YOU AND SEATHERDER EACH WAIVE THE
            RIGHT TO A JURY TRIAL FOR ANY DISPUTES NOT SUBJECT TO ARBITRATION.
          </ImportantNotice>
        </Section>

        <Section id="termination" title="15. Termination">
          <SubSection title="Termination by You">
            <Paragraph>
              You may delete your account at any time through your account
              settings. Upon deletion, your data will be removed according to
              our Privacy Policy.
            </Paragraph>
          </SubSection>

          <SubSection title="Termination by Us">
            <Paragraph>
              We reserve the right to suspend or terminate your access to the
              Service at any time, with or without notice, for any reason,
              including but not limited to:
            </Paragraph>
            <BulletList
              items={[
                "Violation of these Terms",
                "Violation of applicable law",
                "Fraudulent, harassing, or abusive behavior",
                "Extended periods of inactivity",
                "Technical or security reasons",
                "At our sole discretion for business reasons",
              ]}
            />
          </SubSection>

          <SubSection title="Effect of Termination">
            <Paragraph>Upon termination:</Paragraph>
            <BulletList
              items={[
                "Your right to access the Service immediately ceases",
                "No refunds will be provided for any prepaid fees",
                "You remain liable for all obligations incurred prior to termination",
                "We may delete your data according to our retention policies",
                "Provisions that should survive termination (including limitation of liability, indemnification, arbitration, and governing law) will remain in effect",
              ]}
            />
          </SubSection>
        </Section>

        <Section
          id="modifications-to-terms-and-service"
          title="16. Modifications to Terms and Service"
        >
          <SubSection title="Modifications to Service">
            <Paragraph>
              We reserve the right to modify, suspend, or discontinue the
              Service (or any part thereof) at any time, with or without notice.
              We shall not be liable to you or any third party for any
              modification, suspension, or discontinuation of the Service.
            </Paragraph>
            <Paragraph>
              We may add, change, or remove features and functionality without
              prior notice. The Service may become unavailable due to
              maintenance, updates, or technical issues. We provide no specific
              uptime guarantee, and you are responsible for maintaining your own
              backups of any data.
            </Paragraph>
          </SubSection>

          <SubSection title="Changes to Terms">
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
              acceptance of the new terms. If you do not agree to the changes,
              you should stop using the Service and delete your account.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="severability" title="17. Severability">
          <Paragraph>
            If any provision of these Terms is deemed invalid, illegal, or
            unenforceable by a court or arbitrator of competent jurisdiction,
            that provision shall be limited or eliminated to the minimum extent
            necessary so that the remaining provisions of these Terms remain in
            full force and effect.
          </Paragraph>
        </Section>

        <Section id="entire-agreement" title="18. Entire Agreement">
          <SubSection title="Complete Agreement">
            <Paragraph>
              These Terms, together with our Privacy Policy and any additional
              terms incorporated by reference, constitute the entire agreement
              between you and Seatherder regarding the Service and supersede all
              prior and contemporaneous understandings, agreements,
              representations, and warranties, whether written or oral.
            </Paragraph>
          </SubSection>

          <SubSection title="No Waiver">
            <Paragraph>
              Our failure to enforce any right or provision of these Terms shall
              not constitute a waiver of such right or provision. Any waiver of
              any provision of these Terms will be effective only if in writing
              and signed by Seatherder.
            </Paragraph>
          </SubSection>

          <SubSection title="Assignment">
            <Paragraph>
              You may not assign or transfer these Terms or your rights and
              obligations hereunder without our prior written consent. We may
              freely assign these Terms at any time without notice or consent.
            </Paragraph>
          </SubSection>

          <SubSection title="Force Majeure">
            <Paragraph>
              We shall not be liable for any delay or failure to perform
              resulting from causes beyond our reasonable control, including but
              not limited to acts of God, war, terrorism, riots, embargoes, acts
              of civil or military authorities, fire, floods, accidents,
              pandemics, strikes, or shortages of transportation, facilities,
              fuel, energy, labor, or materials.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="additional-provisions" title="19. Additional Provisions">
          <SubSection title="No Professional Advice">
            <Paragraph>
              You acknowledge and agree that Seatherder provides an event
              management tool only. We do not provide event planning,
              hospitality, or professional advice of any kind. You are solely
              responsible for all decisions regarding your events, including
              seating arrangements, guest management, and communications.
            </Paragraph>
          </SubSection>

          <SubSection title="Third-Party Services">
            <Paragraph>
              The Service may integrate with or contain links to third-party
              services (such as payment processors or email services). We are
              not responsible for the content, policies, or practices of any
              third-party services. Your use of such services is at your own
              risk and subject to their respective terms.
            </Paragraph>
          </SubSection>

          <SubSection title="Data Backup">
            <Paragraph>
              While we take reasonable measures to protect your data, you are
              responsible for maintaining your own backups of any content or
              data you upload to the Service. We are not liable for any loss of
              data.
            </Paragraph>
          </SubSection>
        </Section>

        <Section id="contact-information" title="20. Contact Information">
          <Paragraph>
            If you have questions about these Terms or need to send legal
            notices, please contact us:
          </Paragraph>
          <div className="grid sm:grid-cols-2 gap-4 my-6">
            <ContactCard icon={Mail} title="Email">
              <a
                href="mailto:legal@seatherder.com"
                className="text-primary hover:underline"
              >
                legal@seatherder.com
              </a>
            </ContactCard>
            <ContactCard icon={MapPin} title="Mailing Address">
              <address className="not-italic">
                Seatherder
                <br />
                390 NE 191st St, STE 18899
                <br />
                Miami, FL 33179
              </address>
            </ContactCard>
          </div>
          <Paragraph>
            For arbitration opt-out notices, please send written notice within
            30 days of accepting these Terms to the email or mailing address
            above.
          </Paragraph>
        </Section>

        <Section
          id="acknowledgment-and-acceptance"
          title="21. Acknowledgment and Acceptance"
        >
          <SubSection title="Acknowledgment">
            <Paragraph>
              By using the Service, you acknowledge that you have read these
              Terms in their entirety and understand that:
            </Paragraph>
            <BulletList
              items={[
                "Seatherder is an event management tool, not a professional advisory service",
                "You are solely responsible for reviewing and approving all seating arrangements",
                "You are responsible for obtaining proper consent from guests before entering their data",
                "The Service is provided for organizational purposes only",
                "You bear sole responsibility for decisions made based on information from the Service",
                "You agree to the arbitration agreement, class action waiver, limitation of liability, disclaimers, and indemnification provisions contained herein",
              ]}
            />
          </SubSection>

          <SubSection title="Acceptance">
            <Paragraph>
              Your access to and use of the Service constitutes your acceptance
              of and agreement to be bound by these Terms. If you do not agree
              to these Terms, you must not access or use the Service.
            </Paragraph>
          </SubSection>
        </Section>

        <Divider />

        <div className="text-center text-muted-foreground text-sm">
          <p className="mb-2">
            <Strong>Effective Date:</Strong> January 1, 2026 |{" "}
            <Strong>Last Updated:</Strong> January 2026 |{" "}
            <Strong>Version:</Strong> 1.0
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>🐕</span> Seatherder. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
