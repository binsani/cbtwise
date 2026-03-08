import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container max-w-3xl py-16">
      <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-muted max-w-none space-y-4 text-muted-foreground">
        <p><strong>Last updated:</strong> March 2026</p>
        <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
        <p>We collect information you provide when creating an account (name, email) and data generated through your use of the platform (exam attempts, scores, time spent).</p>
        <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
        <p>Your data is used to provide personalised practice recommendations, track your progress, and improve the platform experience. We do not sell your personal data to third parties.</p>
        <h2 className="text-xl font-semibold text-foreground">3. Data Storage</h2>
        <p>Your data is stored securely using industry-standard encryption and hosted on trusted cloud infrastructure.</p>
        <h2 className="text-xl font-semibold text-foreground">4. Cookies</h2>
        <p>We use essential cookies to maintain your login session. No third-party tracking cookies are used.</p>
        <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
        <p>You may request access to, correction, or deletion of your personal data by contacting us through our <a href="/contact" className="text-primary underline">Contact page</a>.</p>
        <h2 className="text-xl font-semibold text-foreground">6. Changes</h2>
        <p>We may update this policy from time to time. We will notify users of significant changes via email or in-app notification.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
