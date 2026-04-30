import { Flame } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full border-b border-border px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Flame size={20} className="text-primary" />
          <span className="font-bold font-display text-lg">RoastersAI</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-bold font-display text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: January 2025</p>
        </div>

        <p className="text-base leading-relaxed text-foreground/90">
          We take your privacy seriously. Here's exactly what we do (and don't do) with the information you provide when using RoastersAI.
        </p>

        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-bold text-primary mb-2 text-lg">What We Collect</h2>
            <p className="text-sm leading-relaxed text-foreground/80">
              When you use RoastersAI, you voluntarily provide details like your name, city, job, and relationship status. <strong>This information is used solely to generate your roast in real-time</strong> and is not stored in any permanent database tied to you personally.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-bold text-primary mb-2 text-lg">What We Don't Do</h2>
            <ul className="text-sm leading-relaxed text-foreground/80 flex flex-col gap-2 list-disc ml-4">
              <li>We do not sell your data to any third parties.</li>
              <li>We do not create user profiles or track you across sessions.</li>
              <li>We do not require account creation or email registration.</li>
              <li>We do not use your data for AI training.</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-bold text-primary mb-2 text-lg">Analytics</h2>
            <p className="text-sm leading-relaxed text-foreground/80">
              We use anonymised analytics to understand how many people use the app and which features are popular. No personally identifiable information is included in these analytics.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-bold text-primary mb-2 text-lg">Cookies &amp; Local Storage</h2>
            <p className="text-sm leading-relaxed text-foreground/80">
              We use minimal browser storage (localStorage) only to remember your roast history and fire vote preferences locally on your device. This data never leaves your browser.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h2 className="font-bold text-primary mb-2 text-lg">Third-Party Services</h2>
            <p className="text-sm leading-relaxed text-foreground/80">
              Roast generation is powered by Groq AI. Your input is sent to Groq's API to generate the roast. Please refer to{" "}
              <a href="https://groq.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Groq's privacy policy
              </a>{" "}
              for details on how they handle API data.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-4">
          By using RoastersAI, you agree to this policy. If you have questions, contact us at{" "}
          <a href="mailto:roastersai@gmail.com" className="text-primary hover:underline">roastersai@gmail.com</a>.
        </p>

        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm w-fit">
          ← Back to RoastersAI
        </Link>
      </main>

      <footer className="w-full py-6 border-t border-border bg-card text-center text-xs text-muted-foreground">
        RoastersAI © {new Date().getFullYear()} · <Link href="/about" className="hover:text-primary transition-colors">About</Link> · <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
      </footer>
    </div>
  );
}
