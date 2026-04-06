/**
 * Dynamic subscription cap for free-tier users.
 * Cap = 50% of total subscriptions, floor of 50.
 * Users with ≤50 total subscriptions have no cap.
 * Pro users have no cap.
 */
export function getChannelCap(totalChannels, isPro = false) {
  if (isPro) return totalChannels;
  if (totalChannels <= 50) return totalChannels; // no cap needed
  return Math.max(50, Math.floor(totalChannels * 0.5));
}
