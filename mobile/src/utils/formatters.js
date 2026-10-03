// Small display helpers shared by several components.

const MAX_INITIALS = 2;

/**
 * Builds avatar initials from a full name ("Anjali Perera" -> "AP").
 * @param {string} [fullName] - The user's full name.
 * @returns {string} Up to two uppercase letters, or an empty string.
 */
export function getNameInitials(fullName = '') {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((namePart) => namePart[0].toUpperCase())
    .join('');
}
