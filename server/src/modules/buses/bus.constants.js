// Enum values and reference data for BUS (Member 02).

const BUS_STATUSES = Object.freeze({
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  /** retired: kept for history and reporting, but never assigned or tracked again. */
  RETIRED: 'retired',
});

/** The bus models this operator runs. A fixed list keeps the fleet table consistent. */
const BUS_MODELS = Object.freeze([
  'Ashok Leyland Viking',
  'Ashok Leyland Lynx',
  'TATA Marcopolo',
  'TATA Starbus',
  'Lanka Ashok Leyland',
  'Other',
]);

/** busCode is "BUS-014": a short code staff say out loud, unlike a Mongo id. */
const BUS_CODE_PREFIX = 'BUS';
const BUS_CODE_DIGITS = 3;

module.exports = { BUS_STATUSES, BUS_MODELS, BUS_CODE_PREFIX, BUS_CODE_DIGITS };
