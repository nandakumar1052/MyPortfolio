import { redirect } from "react-router";
import type { Route } from "./+types/admin.logout";
import { destroySession, getSession } from "~/lib/session.server";
import { assertSameOrigin } from "~/lib/security.server";

export async function action({ request, context }: Route.ActionArgs) {
  assertSameOrigin(request);
  const session = await getSession(request, context);
  return redirect("/", {
    headers: { "Set-Cookie": await destroySession(session, context) },
  });
}

export async function loader() {
  return redirect("/");
}
