import { Outlet } from "react-router";
import type { Route } from "./+types/public";
import { Nav } from "~/components/nav";
import { Footer } from "~/components/footer";
import { getSocialLinks } from "~/lib/db";

export async function loader({ context }: Route.LoaderArgs) {
  const socials = await getSocialLinks(context);
  return { socials };
}

export default function PublicLayout({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer socials={loaderData.socials} />
    </>
  );
}
