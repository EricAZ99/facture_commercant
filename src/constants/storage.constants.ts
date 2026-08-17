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
  adminRefreshToken: 'facture_ia_admin_refresh_token'
} as const
