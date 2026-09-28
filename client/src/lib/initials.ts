/**
 * Identity display helpers for the business workspace launcher.
 *
 * `users.name` is a single free-text column and `businesses` has no short-code
 * column, so initials and codes are derived rather than read.
 */

/** Up to two uppercase initials, e.g. "Jobelle Bookshop" -> "JB". */
export function initialsOf(value: string | null | undefined): string {
  const words = (value ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** First token of a single-name column, e.g. "elijah musando" -> "elijah". */
export function firstNameOf(value: string | null | undefined): string {
  return (value ?? "").trim().split(/\s+/).filter(Boolean)[0] ?? "";
}

/** "owner" -> "Owner"; unknown roles are passed through capitalised. */
export function roleLabelOf(value: string | null | undefined): string {
  const role = (value ?? "").trim();
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Short code shown next to the business name.
 *
 * `businesses` has no code column, so a real `code` on the payload wins and we
 * otherwise derive one from the registered name: the first word, upper-cased and
 * capped at six characters ("Main Shop" -> "MAIN").
 */
export function businessCodeOf(
  business: { name?: string | null; code?: string | null } | null | undefined
): string {
  const explicit = (business?.code ?? "").trim();
  if (explicit) return explicit.toUpperCase();

  const [firstWord = ""] = (business?.name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!firstWord) return "";
  return firstWord.slice(0, 6).toUpperCase();
}
