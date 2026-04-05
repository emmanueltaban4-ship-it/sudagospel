import Layout from "@/components/Layout";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const PrivacyPolicyPage = () => {
  useDocumentMeta({ title: "Privacy Policy | SudaGospel", description: "Privacy Policy for SudaGospel music streaming app" });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 5, 2026</p>
        </div>

        <section className="space-y-4 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Introduction</h2>
            <p>Welcome to SudaGospel ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Information We Collect</h2>
            <p className="mb-2">We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Account Information:</strong> Name, email address, and profile picture when you create an account.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Information about how you interact with the Service, including songs played, playlists created, and artists followed.</li>
              <li><strong className="text-foreground">Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
              <li><strong className="text-foreground">Log Data:</strong> IP address, browser type, pages visited, and timestamps.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide, maintain, and improve the Service</li>
              <li>To personalize your experience and deliver relevant content</li>
              <li>To communicate with you about updates, promotions, and support</li>
              <li>To monitor usage patterns and analyze trends</li>
              <li>To detect, prevent, and address technical issues and fraud</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Sharing of Information</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Service Providers:</strong> Third-party companies that help us operate the Service (e.g., hosting, analytics).</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide the Service. You may request deletion of your account and associated data at any time.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">7. Children's Privacy</h2>
            <p>The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected such information, we will delete it promptly.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">8. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access, update, or delete your personal information</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@sudagospel.net" className="text-primary hover:underline">support@sudagospel.net</a>.</p>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
