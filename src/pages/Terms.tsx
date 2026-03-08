import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container max-w-3xl py-16">
      <h1 className="font-display text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose prose-muted max-w-none space-y-4 text-muted-foreground">
        <p><strong>Last updated:</strong> March 2026</p>
        <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing and using CBTWise, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
        <h2 className="text-xl font-semibold text-foreground">2. Use of Service</h2>
        <p>CBTWise provides an online platform for practising past examination questions (UTME, WAEC, NECO). The service is intended for educational purposes only. You must be at least 13 years old to use this service.</p>
        <h2 className="text-xl font-semibold text-foreground">3. Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
        <h2 className="text-xl font-semibold text-foreground">4. Content</h2>
        <p>Examination questions are sourced from publicly available past papers. CBTWise does not claim ownership of these questions. All platform content, design, and code remain the intellectual property of CBTWise.</p>
        <h2 className="text-xl font-semibold text-foreground">5. Limitation of Liability</h2>
        <p>CBTWise is provided "as is" without warranties. We are not liable for any academic outcomes resulting from the use of this platform.</p>
        <h2 className="text-xl font-semibold text-foreground">6. Changes</h2>
        <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms.</p>
        <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
        <p>For questions about these terms, please visit our <a href="/contact" className="text-primary underline">Contact page</a>.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
