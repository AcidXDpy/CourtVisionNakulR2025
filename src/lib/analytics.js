export function trackEvent(name, properties = {}) {
  const payload = {
    name,
    properties,
    timestamp: new Date().toISOString(),
  };

  try {
    window.dispatchEvent(new CustomEvent('gearvision:event', { detail: payload }));

    if (window.plausible) window.plausible(name, { props: properties });
    if (window.va) window.va('event', { name, ...properties });
    if (window.posthog?.capture) window.posthog.capture(name, properties);
    if (window.gtag) window.gtag('event', name, properties);

    if (import.meta.env.DEV) console.info('[GearVision analytics]', payload);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[GearVision analytics skipped]', error);
  }
}
