import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-primary to-secondary p-8 text-center text-primary-foreground md:p-12">
          <h2 className="mb-3 font-display text-3xl font-bold md:text-4xl">
            Ready to Start Drilling?
          </h2>
          <p className="mb-6 opacity-90">
            Join thousands of Nigerian students already preparing smarter with CBTWise.
          </p>
          <Button variant="accent" size="xl" asChild>
            <Link to="/signup">
              Create Free Account <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
