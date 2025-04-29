const config = require('../utils/config');

function checkNextSproutAutomation(_, res) {
  res.json({ nextSproutAutomation: config.NEXT_SPROUT_AUTOMATION });
}

module.exports = checkNextSproutAutomation;
