import { NavLink, Link } from "react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/experience", label: "Experience" },
  { to: "/projects", label: "Projects" },
  { to: "/skills", label: "Skills" },
  { to: "/resume", label: "Resume" },
  { to: "/contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-background)]/60">
      <div className="container-tight flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
            NK
          </span>
          <span className="hidden sm:inline">Nanda Kumar</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-[var(--color-accent)]"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--color-border)]">
          <nav className="container-tight flex flex-col py-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
