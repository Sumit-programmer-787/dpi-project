// A small local list for learning purposes. In production this would
// be refreshed periodically from a live threat-intelligence feed.
const BLACKLISTED_IPS = new Set([
  '45.155.205.233',
  '185.220.101.1',
  '194.165.16.28',
  // Add any IP here to test the rule — e.g. your own test address.
]);

function isBlacklisted(ip) {
  return BLACKLISTED_IPS.has(ip);
}

module.exports = { isBlacklisted, BLACKLISTED_IPS };