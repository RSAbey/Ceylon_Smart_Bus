// Constants for the driver's ticket verification feature (Member 03).

/** Must match server/src/modules/verification/verification.constants.js. */
export const VERIFICATION_METHODS = Object.freeze({
  QR: 'qr',
  TICKET_KEY: 'ticketKey',
});

export const VERIFICATION_RESULTS = Object.freeze({
  VALID: 'valid',
  INVALID: 'invalid',
});

/** The two ways to check a ticket, shown as a toggle so typing is always one tap away (NFR-06). */
export const VERIFICATION_MODES = Object.freeze([
  { method: VERIFICATION_METHODS.QR, label: 'Scan QR', iconName: 'qr-code-outline' },
  { method: VERIFICATION_METHODS.TICKET_KEY, label: 'Type code', iconName: 'keypad-outline' },
]);

/** Only this QR format is accepted, and it is what the passenger's ticket screen encodes. */
export const QR_PAYLOAD_TYPE = 'ceylon-smart-bus-ticket';

export const VERIFICATION_MESSAGES = Object.freeze({
  cameraNeeded: 'Allow camera access to scan ticket QR codes, or type the ticket code instead.',
  cameraDenied: 'Camera access is off. Type the ticket code instead, or turn the camera on in Settings.',
  aimAtCode: 'Hold the passenger’s QR code inside the frame.',
  unreadableCode: 'That QR code is not a Ceylon Smart Bus ticket.',
  typeHint: 'Ticket codes look like CSB-408213.',
  scanAnother: 'Check another ticket',
  noChecksYet: 'No tickets checked on this trip yet.',
});
