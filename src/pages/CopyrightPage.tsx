import Layout from "@/components/Layout";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const CopyrightPage = () => {
  useDocumentMeta({ title: "Copyright | SudaGospel", description: "Copyright information for SudaGospel music streaming platform" });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Copyright Notice</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 9, 2026</p>
        </div>

        <section className="space-y-4 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Ownership</h2>
            <p>All content, design, graphics, logos, and software on SudaGospel ("the Platform") are the property of SudaGospel or its content suppliers and are protected by international copyright laws. The compilation of all content on this Platform is the exclusive property of SudaGospel.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Music Content</h2>
            <p>All music, audio recordings, album artwork, and related materials uploaded to SudaGospel remain the intellectual property of their respective artists, producers, and rights holders. SudaGospel does not claim ownership of user-uploaded content.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. License to Use</h2>
            <p>By uploading content to SudaGospel, artists grant us a non-exclusive, worldwide, royalty-free license to stream, display, and distribute the content on our platform for the purpose of operating the service. Artists may remove their content at any time.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Prohibited Use</h2>
            <p className="mb-2">You may not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Reproduce, distribute, or create derivative works from any content on the Platform without express written permission.</li>
              <li>Use any automated tools, bots, or scrapers to download or copy content from the Platform.</li>
              <li>Re-upload, re-distribute, or sell any music or content obtained from SudaGospel.</li>
              <li>Remove or alter any copyright, trademark, or proprietary notices from content on the Platform.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Reporting Copyright Violations</h2>
            <p>If you believe your copyrighted work has been used without authorization on SudaGospel, please refer to our <a href="/dmca" className="text-primary hover:underline">DMCA Policy</a> for instructions on filing a takedown notice.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">6. Contact</h2>
            <p>For copyright-related inquiries, contact us at <span className="text-foreground">copyright@sudagospel.com</span>.</p>
          </div>
        </section>

        <div className="border-t border-border/30 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SudaGospel. All rights reserved.
        </div>
      </div>
    </Layout>
  );
};

export default CopyrightPage;
