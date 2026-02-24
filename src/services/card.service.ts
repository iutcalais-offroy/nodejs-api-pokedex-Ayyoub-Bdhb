import { findAllCards } from '../repository/card.repository'

/**
 * Récupère l'ensemble des cartes Pokémon.
 *
 * Interroge la base de données pour retourner toutes les cartes disponibles.
 *
 * @returns {Promise<any[]>} Liste complète des cartes.
 *
 * @throws {Error} 500 - En cas d'erreur serveur lors de la récupération.
 */
export const getAllCards = async () => {
  try {
    return await findAllCards()
  } catch {
    throw { status: 500, message: 'Erreur serveur.' }
  }
}