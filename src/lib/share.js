import { trackEvent } from './analytics.js';

export async function shareGearVision(source = 'unknown') {
  const shareUrl = window.location.origin;
  const shareData = {
    title: 'GearVision | Tennis Gear Recommendations',
    text: 'Find smarter racket, string, and tension setups based on your playstyle, goals, budget, and injury history.',
    url: shareUrl,
  };

  trackEvent('share_clicked', { source });

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return { ok: true, method: 'native' };
    }

    await navigator.clipboard.writeText(shareUrl);
    return { ok: true, method: 'clipboard' };
  } catch (error) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return { ok: true, method: 'clipboard' };
    } catch {
      return { ok: false, error };
    }
  }
}
