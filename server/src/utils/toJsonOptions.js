// Shared toJSON settings so every model exposes `id` instead of `_id` and never leaks internal fields.

/**
 * Builds the schema `toJSON` option used by all 20 models (one helper instead of 20 copies).
 * @param {string[]} [hiddenFieldNames] - Extra fields to remove from API output (for example passwordHash).
 * @returns {object} Mongoose toJSON schema option.
 */
function buildToJsonOptions(hiddenFieldNames = []) {
  return {
    versionKey: false,
    transform(_mongooseDocument, jsonOutput) {
      jsonOutput.id = String(jsonOutput._id);
      delete jsonOutput._id;
      hiddenFieldNames.forEach((hiddenFieldName) => {
        delete jsonOutput[hiddenFieldName];
      });
      return jsonOutput;
    },
  };
}

module.exports = buildToJsonOptions;
