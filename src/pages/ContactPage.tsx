import { useState } from "react";
import Layout from "@/components/Layout";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

const ContactPage = () => {
  useDocumentMeta({ title: "Contact Us | SudaGospel", description: "Get in touch with the SudaGospel team" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground">Have a question, feedback, or partnership inquiry? We'd love to hear from you.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Email</h3>
                <p className="text-muted-foreground text-sm">info@sudagospel.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Phone</h3>
                <p className="text-muted-foreground text-sm">+211 XXX XXX XXX</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Location</h3>
                <p className="text-muted-foreground text-sm">Juba, South Sudan</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required placeholder="What's this about?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" required placeholder="Tell us more..." rows={4} />
            </div>
            <Button type="submit" disabled={sending} className="w-full bg-gradient-gold text-primary-foreground">
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
