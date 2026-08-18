/** Cles utilisees pour la persistance locale (localStorage). */
export const STORAGE_KEYS = {
  accessToken: 'facture_ia_access_token',
  refreshToken: 'facture_ia_refresh_token',
  /**
   * Jetons de l'espace admin plateforme, dans des cles distinctes de la
   * session commercant : les deux sessions (commercant et admin) peuvent
   * coexister dans le meme navigateur sans jamais se melanger.
   */
  adminAccessToken: 'facture_ia_admin_access_token',
  adminRefreshToken: 'facture_ia_admin_refresh_token',
  /** Disposition (ordre + visibilite) des widgets du tableau de bord — preference locale, par navigateur. */
  dashboardLayout: 'facture_ia_dashboard_layout',
  /** Date de fin d'essai pour laquelle la banniere de compte a rebours a ete fermee (par navigateur). */
  trialBannerDismissedUntil: 'facture_ia_trial_banner_dismissed_until',
  /** Preferences d'accessibilite (taille de police, contraste eleve) — par navigateur. */
  accessibilityPrefs: 'facture_ia_accessibility_prefs',
  /** Horodatage de la derniere activite consultee dans le centre de notifications. */
  notificationsLastSeenAt: 'facture_ia_notifications_last_seen_at',
  /** Marque l'onboarding guide comme deja vu, par commerce (cle suffixee par businessId). */
  onboardingSeenPrefix: 'facture_ia_onboarding_seen_',
  /**
   * Marque la session courante comme un "mode apercu" admin (voir
   * `ImpersonatePage.vue`/`ImpersonationBanner.vue`). Volontairement dans
   * `sessionStorage` (pas `localStorage`) : chaque onglet a son propre
   * `sessionStorage`, donc l'onglet d'apercu ouvert par l'admin ne "contamine"
   * jamais une session commercant normale dans un autre onglet.
   */
  impersonationSessionFlag: 'facture_ia_impersonating'
} as const
