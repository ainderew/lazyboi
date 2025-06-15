import config from '../utils/config.js';

function checkNextSproutAutomation(_, res) {
  res.json({ nextSproutAutomation: config.NEXT_SPROUT_AUTOMATION });
}

export default checkNextSproutAutomation;
