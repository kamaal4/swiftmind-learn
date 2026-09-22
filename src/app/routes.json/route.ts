import { content } from "@/content";

export const dynamic = "force-static";

// The service worker precaches this list, and it is generated from the content itself — so
// a new concept or release can never be missing from the offline copy.
export function GET() {
  const routes = [
    "/",
    "/learn",
    "/quiz",
    "/interview",
    "/whats-new",
    "/progress",
    ...content.categories.flatMap((c) => [`/learn/${c.id}`, `/interview/${c.id}`]),
    ...content.concepts.map((c) => `/learn/${c.categoryID}/${c.id}`),
    ...content.releases.map((r) => `/whats-new/${r.id}`),
  ];

  return Response.json(routes);
}
