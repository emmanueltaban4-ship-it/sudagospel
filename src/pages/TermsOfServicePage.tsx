import Layout from "@/components/Layout";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const TermsOfServicePage = () => {
  useDocumentMeta({ title: "Terms of Service | SudaGospel", description: "Terms of Service for SudaGospel music streaming app" });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 5, 2026</p>
        </div>

        <section className="space-y-4 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using SudaGospel ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Description of Service</h2>
            <p>SudaGospel is a gospel music streaming and discovery platform focused on South Sudanese gospel music. The Service allows users to stream music, create playlists, follow artists, and engage with the gospel music community.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for all activities that occur under your account.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. User Content</h2>
            <p className="mb-2">By uploading content to the Service, you:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Represent that you own or have the rights to share such content.</li>
              <li>Grant SudaGospel a non-exclusive, worldwide license to use, display, and distribute your content through the Service.</li>
              <li>Agree not to upload content that infringes on any third party's intellectual property rights.</li>
              <li>Understand that uploaded content may be subject to review and approval before being published.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Prohibited Conduct</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Upload malicious software or harmful content</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Reproduce, distribute, or create derivative works from the Service's content without permission</li>
              <li>Use automated tools to scrape or collect data from the Service</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Intellectual Property</h2>
            <p>All content on the Service, including but not limited to music, artwork, text, and software, is protected by copyright and other intellectual property laws. Artists retain ownership of their uploaded music. The SudaGospel name, logo, and branding are trademarks of SudaGospel.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Subscriptions & Payments</h2>
            <p>Some features may require a paid subscription. Subscription terms, pricing, and billing cycles will be clearly presented before purchase. You may cancel your subscription at any time through your account settings.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms. You may delete your account at any time. Upon termination, your right to use the Service will cease immediately.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, SudaGospel shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of South Sudan, without regard to its conflict of law provisions.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">12. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">13. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@sudagospel.net" className="text-primary hover:underline">support@sudagospel.net</a>.</p>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default TermsOfServicePage;
