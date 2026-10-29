import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  type LinksFunction,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },
];

export function meta() {
  return [
    { title: "Nanda Kumar — Software Engineer | GenAI & Automation" },
    {
      name: "description",
      content:
        "Software Engineer with 3+ years building GenAI assistants, automation pipelines, and high-traffic e-commerce platforms for Fortune 100 clients.",
    },
    { name: "theme-color", content: "#3b3eea" },
    { name: "robots", content: "index, follow" },
    { property: "og:type", content: "website" },
    {
      property: "og:site_name",
      content: "Nanda Kumar — Portfolio",
    },
    {
      property: "og:title",
      content: "Nanda Kumar — Software Engineer | GenAI & Automation",
    },
    {
      property: "og:description",
      content:
        "Portfolio of Nanda Kumar — building GenAI-driven internal tools and large-scale automation for Fortune 100 platforms.",
    },
    { property: "og:url", content: "https://nandakumaronline.com" },
    {
      property: "og:image",
      content: "https://nandakumaronline.com/og-image.png",
    },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    {
      property: "og:image:alt",
      content: "Nanda Kumar — Software Engineer · GenAI & Automation",
    },
    // Twitter / X Card
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "Nanda Kumar — Software Engineer | GenAI & Automation",
    },
    {
      name: "twitter:description",
      content:
        "Portfolio of Nanda Kumar — building GenAI-driven internal tools and large-scale automation for Fortune 100 platforms.",
    },
    {
      name: "twitter:image",
      content: "https://nandakumaronline.com/og-image.png",
    },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let detail = "An unexpected error happened. Please try again.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    detail = error.data || detail;
  } else if (import.meta.env.DEV && error instanceof Error) {
    detail = error.message;
  }

  return (
    <main className="min-h-[80vh] grid place-items-center px-6">
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold text-[var(--color-primary)]">Error</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-[var(--color-muted-foreground)]">{detail}</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
