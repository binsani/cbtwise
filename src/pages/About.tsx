import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GraduationCap, Target, Users, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-16">
        <h1 className="mb-4 font-display text-3xl font-bold md:text-4xl">About CBTWise</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          We're on a mission to help every Nigerian student prepare confidently for their exams — from the comfort of their phone.
        </p>

        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {[
            { icon: Target, title: "Our Mission", desc: "Make quality exam preparation accessible and affordable for every Nigerian student preparing for UTME, WAEC, or NECO." },
            { icon: GraduationCap, title: "What We Do", desc: "We provide curated past questions, realistic CBT simulations, detailed explanations, and smart performance analytics." },
            { icon: Users, title: "Who We Serve", desc: "Secondary school students, JAMB candidates, and anyone preparing for WAEC or NECO examinations across Nigeria." },
            { icon: Heart, title: "Why It Matters", desc: "Education changes lives. We believe every student deserves the best tools to prepare, regardless of location or income." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-display text-base font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-muted p-6">
          <h2 className="mb-2 font-display text-xl font-bold">Built in Nigeria, for Nigeria</h2>
          <p className="text-sm text-muted-foreground">
            CBTWise is designed specifically for the Nigerian education system. We focus exclusively on UTME (JAMB), WAEC, and NECO — the three exams that matter most for your academic journey. Our platform is optimised for mobile usage and low data consumption, because we know that's how most Nigerian students access the internet.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
