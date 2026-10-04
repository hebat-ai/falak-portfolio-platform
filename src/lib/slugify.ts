/**
 * Matches the server-side slug pattern every create-company/create-
 * vehicle action validates against (/^[a-z0-9]+(-[a-z0-9]+)?$/-shaped):
 * lowercase, digits, and single hyphens between words, no leading/
 * trailing/doubled hyphens. Used to auto-fill the slug field from the
 * English name as the user types, so "That's not a valid slug" is no
 * longer something a form can silently produce just by typing a normal
 * company name.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
