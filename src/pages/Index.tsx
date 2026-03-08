import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ExamCards from "@/components/landing/ExamCards";
import BenefitsSection from "@/components/landing/BenefitsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingTeaser from "@/components/landing/PricingTeaser";
import FAQPreview from "@/components/landing/FAQPreview";
import CTASection from "@/components/landing/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ExamCards />
        <HowItWorks />
        <BenefitsSection />
        <TestimonialsSection />
        <PricingTeaser />
        <FAQPreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
