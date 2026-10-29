import { Link } from "react-router";
import { Github, Linkedin, Mail } from "lucide-react";
import type { SocialLink } from "~/lib/db";

export function Footer({ socials }: { socials: SocialLink[] }) {
  const iconFor = (label: string) => {
    const k = label.toLowerCase();
    if (k.includes("github")) return <Github size={16} />;
    if (k.includes("linkedin")) return <Linkedin size={16} />;
    if (k.includes("mail") || k.includes("email")) return <Mail size={16} />;
    return null;
  };
  return (
    <footer className="border-t border-[var(--color-border)] mt-24">
      <div className="container-tight py-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          © {new Date().getFullYear()} Nanda Kumar. Built with React Router 7,
          Cloudflare Workers, and D1.
        </p>
        <div className="flex items-center gap-4">
          {socials.map((s) => (
            <Link
              key={s.id}
              to={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              {iconFor(s.label)}
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
