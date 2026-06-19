export function initializeAds(): void {
  console.log('[ads] AdMob placeholder — not configured');
}

export function showInterstitialAd(): Promise<void> {
  console.log('[ads] Interstitial placeholder — skipped');
  return Promise.resolve();
}

export function isAdsEnabled(): boolean {
  return false;
}
