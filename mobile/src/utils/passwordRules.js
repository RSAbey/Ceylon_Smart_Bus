// The three rules a password has to meet (Member 01, NFR-07). They are the same three the server
// enforces in auth.validation.js: the meter in the app is a courtesy, the server is what decides.

export const MIN_PASSWORD_LENGTH = 8;

const UPPERCASE_PATTERN = /[A-Z]/;
const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

/** One entry per segment of the strength meter, in the order they are drawn. */
export const PASSWORD_RULES = Object.freeze([
  {
    key: 'length',
    label: `${MIN_PASSWORD_LENGTH} characters`,
    isMet: (password) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    key: 'uppercase',
    label: 'A capital letter',
    isMet: (password) => UPPERCASE_PATTERN.test(password),
  },
  {
    key: 'symbol',
    label: 'A symbol, such as @ or !',
    isMet: (password) => SYMBOL_PATTERN.test(password),
  },
]);

/**
 * Measures a password against the three rules.
 * @param {string} password - What has been typed so far.
 * @returns {{results: Array<{key: string, label: string, isMet: boolean}>, metCount: number,
 *   isStrongEnough: boolean, missingLabels: string[]}} What is met and what is still missing.
 */
export function measurePassword(password = '') {
  const results = PASSWORD_RULES.map((passwordRule) => ({
    key: passwordRule.key,
    label: passwordRule.label,
    isMet: passwordRule.isMet(password),
  }));
  const metCount = results.filter((ruleResult) => ruleResult.isMet).length;
  return {
    results,
    metCount,
    isStrongEnough: metCount === PASSWORD_RULES.length,
    missingLabels: results.filter((ruleResult) => !ruleResult.isMet).map((ruleResult) => ruleResult.label),
  };
}

/**
 * The one-line instruction shown under the meter while a rule is still unmet.
 * @param {string[]} missingLabels - Rules not met yet.
 * @returns {string} What is still needed, or an empty string when the password is strong enough.
 */
export function describeMissingRules(missingLabels) {
  if (missingLabels.length === 0) return '';
  return `Still needed: ${missingLabels.join(', ').toLowerCase()}.`;
}
