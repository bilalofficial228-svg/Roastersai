import { Flame, Mail, Bug, Handshake } from "lucide-react";
import { Link } from "wouter";

export default function ContactPage() {
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
          <h1 className="text-4xl font-bold font-display text-foreground mb-2">Contact Us 📩</h1>
          <p className="text-muted-foreground text-sm">We read every message — and we may roast you back 🔥</p>
        </div>

        <p className="text-base leading-relaxed text-foreground/90">
          Got feedback, a bug report, a collaboration idea, or just want to tell us you loved (or hated) your roast? We'd love to hear from you.
        </p>

        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-xl border border-border bg-card flex gap-4 items-start">
            <Mail className="text-primary mt-0.5 shrink-0" size={20} />
            <div>
              <h2 className="font-bold text-foreground mb-1">Email</h2>
              <a
                href="mailto:roastersai@gmail.com"
                className="text-primary hover:underline font-medium"
              >
                roastersai@gmail.com
              </a>
              <p className="text-sm text-muted-foreground mt-1">Response time: usually within 24–48 hours. Unless we're busy getting roasted ourselves.</p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card flex gap-4 items-start">
            <Bug className="text-primary mt-0.5 shrink-0" size={20} />
            <div>
              <h2 className="font-bold text-foreground mb-1">Report a Bug</h2>
              <p className="text-sm leading-relaxed text-foreground/80">
                If something feels broken or a roast came out weird, let us know. Include your input details and what language you used. We fix things fast.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card flex gap-4 items-start">
            <Handshake className="text-primary mt-0.5 shrink-0" size={20} />
            <div>
              <h2 className="font-bold text-foreground mb-1">Partnerships</h2>
              <p className="text-sm leading-relaxed text-foreground/80">
                Interested in integrating RoastersAI into your platform or running a branded roast campaign? Reach out — we're open to fun collaborations.
              </p>
            </div>
          </div>
        </div>

        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm w-fit">
          ← Back to RoastersAI
        </Link>
      </main>

      <footer className="w-full py-6 border-t border-border bg-card text-center text-xs text-muted-foreground">
        RoastersAI © {new Date().getFullYear()} · <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link> · <Link href="/about" className="hover:text-primary transition-colors">About</Link>
      </footer>
    </div>
  );
}
