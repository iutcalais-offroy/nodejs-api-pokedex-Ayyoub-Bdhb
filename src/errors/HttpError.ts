/**
 * Classe personnalisée représentant une erreur HTTP.
 *
 * Étend la classe native Error afin d'ajouter
 * un code de statut HTTP (status).
 *
 * Permet d'uniformiser la gestion des erreurs
 * dans l'application (ex: 400, 401, 404, 409, etc.).
 */
export class HttpError extends Error {
  /**
   * Code de statut HTTP associé à l'erreur.
   */
  public status: number

  /**
   * Crée une nouvelle erreur HTTP.
   *
   * @param {number} status - Code de statut HTTP (ex: 400, 404, 500).
   * @param {string} message - Message décrivant l'erreur.
   */
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}  