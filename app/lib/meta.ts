// React Router v7 doesn't merge parent meta into leaf meta automatically —
// each route's meta() function fully replaces its parent's output. This
// helper makes inheritance explicit: spread the root's defaults, then
// override the bits this route cares about.

type MetaDescriptor = Record<string, unknown>;

/**
 * De-dupes a list of meta descriptors. Later entries win.
 *
 * Identity keys (one descriptor "matches" another if their keys are equal):
 *   - { title }                 → "title"
 *   - { charSet }               → "charset"
 *   - { name: "x", content }    → "name:x"
 *   - { property: "x", content }→ "property:x"
 *   - anything else             → exact-JSON match
 */
export function mergeMeta(
  parentMeta: ReadonlyArray<MetaDescriptor>,
  leafMeta: ReadonlyArray<MetaDescriptor>,
): MetaDescriptor[] {
  const keyOf = (m: MetaDescriptor): string => {
    if ("title" in m && m.title !== undefined) return "title";
    if ("charSet" in m && m.charSet !== undefined) return "charset";
    if (typeof m.name === "string") return `name:${m.name}`;
    if (typeof m.property === "string") return `property:${m.property}`;
    if (typeof m.httpEquiv === "string") return `httpEquiv:${m.httpEquiv}`;
    return JSON.stringify(m);
  };

  const overridden = new Set(leafMeta.map(keyOf));
  return [
    ...parentMeta.filter((m) => !overridden.has(keyOf(m))),
    ...leafMeta,
  ];
}

/**
 * Convenience: read the root route's meta from the matches array.
 * Used inside leaf route meta() functions:
 *
 *   export function meta({ matches }: Route.MetaArgs) {
 *     return mergeMeta(rootMeta(matches), [{ title: "My page" }]);
 *   }
 */
export function rootMeta(
  matches: ReadonlyArray<{ id: string; meta?: unknown } | undefined>,
): MetaDescriptor[] {
  const root = matches.find((m) => m?.id === "root");
  return (root?.meta as MetaDescriptor[] | undefined) ?? [];
}
