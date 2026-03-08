import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

const Contact = () => {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl py-16">
        <h1 className="mb-2 font-display text-3xl font-bold md:text-4xl">Contact Us</h1>
        <p className="mb-10 text-muted-foreground">Have a question or need help? Reach out and we'll get back to you.</p>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="space-y-6">
              {[
                { icon: Mail, label: "Email", value: "support@examdrillng.com" },
                { icon: Phone, label: "Phone", value: "+234 801 234 5678" },
                { icon: MapPin, label: "Location", value: "Lagos, Nigeria" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            {sent ? (
              <div className="py-8 text-center">
                <p className="font-display text-lg font-bold text-primary">Message sent!</p>
                <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="How can we help?" rows={4} required />
                </div>
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
