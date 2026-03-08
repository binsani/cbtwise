import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, BookOpen, Crown } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-12">
        <h1 className="mb-6 font-display text-2xl font-bold">Profile & Settings</h1>

        {/* Profile Info */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="font-display text-lg font-bold">Chioma Adebayo</div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> chioma@example.com
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> UTME Candidate
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
              <Crown className="h-3.5 w-3.5" /> Premium
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-base font-bold">Update Profile</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue="Chioma Adebayo" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="chioma@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" placeholder="+234..." />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </div>

        {/* Subscription */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-2 font-display text-base font-bold">Subscription</h2>
          <p className="text-sm text-muted-foreground">Premium Monthly · Renews on April 8, 2026</p>
          <Button variant="outline" size="sm" className="mt-3">Manage Subscription</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
