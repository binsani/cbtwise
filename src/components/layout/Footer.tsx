import { forwardRef } from "react";
import { Link } from "react-router-dom";
import cbtwiseLogo from "@/assets/cbtwise-logo.png";

const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  return (
    <footer ref={ref} className="border-t border-border bg-muted/50">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <img src={cbtwiseLogo} alt="CBTWise logo" loading="lazy" decoding="async" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-display text-lg font-bold">CBTWise</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Nigeria's trusted CBT practice platform for UTME, WAEC, and NECO exam preparation.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">Exams</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/exams" className="hover:text-foreground">UTME (JAMB)</Link></li>
              <li><Link to="/exams" className="hover:text-foreground">WAEC</Link></li>
              <li><Link to="/exams" className="hover:text-foreground">NECO</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CBTWise. All rights reserved.
        </div>
      </div>
    </footer>
  );
});

export default Footer;
