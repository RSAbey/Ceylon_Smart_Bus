// express-validator rules for fare payment and wallet top-up (Member 03).
// Card fields are checked for shape so the demo behaves like a real checkout, then discarded by the
// service: no card number, expiry or CVV is ever written to the database (NFR-07).
const { body } = require('express-validator');
const {
  PAYMENT_METHODS,
  MIN_TOPUP_AMOUNT,
  MAX_TOPUP_AMOUNT,
  CARD_NUMBER_DIGITS,
  CARD_CVV_DIGITS,
} = require('./payment.constants');

/**
 * Builds the four card-field rules. A top-up is always charged to a card, but paying a fare only
 * needs them when the passenger picked card, so the caller decides when they apply.
 * @param {boolean} isAlwaysRequired - True for top-up; false to apply them only when method = card.
 * @returns {Array} express-validator chains for the card fields.
 */
function buildCardDetailRules(isAlwaysRequired) {
  const applyWhenPayingByCard = (chain) =>
    isAlwaysRequired
      ? chain
      : chain.if((_fieldValue, { req: currentRequest }) => currentRequest.body.method === PAYMENT_METHODS.CARD);

  return [
    applyWhenPayingByCard(body('cardNumber'))
      .trim()
      .customSanitizer((cardNumber) => String(cardNumber).replace(/\s/g, ''))
      .isLength({ min: CARD_NUMBER_DIGITS, max: CARD_NUMBER_DIGITS })
      .withMessage(`Enter the ${CARD_NUMBER_DIGITS} digits on the front of the card.`)
      .isNumeric()
      .withMessage('A card number is digits only.'),
    applyWhenPayingByCard(body('cardHolderName'))
      .trim()
      .notEmpty()
      .withMessage('Enter the name printed on the card.'),
    applyWhenPayingByCard(body('cardExpiry'))
      .trim()
      .matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
      .withMessage('Enter the expiry as MM/YY.'),
    applyWhenPayingByCard(body('cardCvv'))
      .trim()
      .isLength({ min: CARD_CVV_DIGITS, max: CARD_CVV_DIGITS })
      .withMessage(`The CVV is the ${CARD_CVV_DIGITS} digits on the back of the card.`)
      .isNumeric()
      .withMessage('A CVV is digits only.'),
  ];
}

const payForTicketValidationRules = [
  body('ticketId').isMongoId().withMessage('Choose the ticket you are paying for.'),
  body('method')
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage('Choose a payment method from the list.'),
  ...buildCardDetailRules(false),
];

const topUpValidationRules = [
  body('amount')
    .isFloat({ min: MIN_TOPUP_AMOUNT, max: MAX_TOPUP_AMOUNT })
    .withMessage(`Top up between Rs. ${MIN_TOPUP_AMOUNT} and Rs. ${MAX_TOPUP_AMOUNT}.`),
  ...buildCardDetailRules(true),
];

module.exports = { payForTicketValidationRules, topUpValidationRules };
