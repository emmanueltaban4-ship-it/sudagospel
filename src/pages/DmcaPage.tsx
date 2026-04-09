import Layout from "@/components/Layout";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const DmcaPage = () => {
  useDocumentMeta({ title: "DMCA Policy | SudaGospel", description: "DMCA takedown policy for SudaGospel music streaming platform" });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">DMCA Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 9, 2026</p>
        </div>

        <section className="space-y-4 text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">1. Overview</h2>
            <p>SudaGospel respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will respond promptly to claims of copyright infringement committed using our platform.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">2. Filing a DMCA Takedown Notice</h2>
            <p className="mb-2">If you believe that content hosted on SudaGospel infringes your copyright, please submit a written notification containing the following:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing, with enough detail to locate it on our platform.</li>
              <li>Your contact information (address, telephone number, and email address).</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement, under penalty of perjury, that the information in the notification is accurate and that you are the copyright owner or authorized to act on behalf of the owner.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">3. Counter-Notification</h2>
            <p>If you believe your content was removed in error, you may file a counter-notification. The counter-notification must include your signature, identification of the removed material, a statement under penalty of perjury that the removal was a mistake, and your consent to jurisdiction.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">4. Repeat Infringers</h2>
            <p>SudaGospel will terminate the accounts of users who are determined to be repeat infringers. We maintain a policy to address repeat copyright violations promptly and effectively.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">5. Contact for DMCA Notices</h2>
            <p>Send all DMCA takedown notices to:</p>
            <div className="bg-muted/50 rounded-lg p-4 mt-2">
              <p className="text-foreground font-medium">SudaGospel DMCA Agent</p>
              <p>Email: dmca@sudagospel.com</p>
              <p>Subject line: DMCA Takedown Notice</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default DmcaPage;
