import { Request, Response } from 'express'
import { getAllCards } from '../services/card.service'

/**
 * Contrôleur pour récupérer toutes les cartes.
 *
 * @param {Request} _req - La requête HTTP (non utilisée ici).
 * @param {Response} res - La réponse HTTP pour renvoyer la liste des cartes.
 *
 * @returns {Promise<Response>} - Liste des cartes triées par numéro Pokédex.
 *
 * @throws {500} - En cas d'erreur serveur.
 */
export const getAllCardsController = async (
  _req: Request,
  res: Response,
) => {
  try {
    const cards = await getAllCards()
    return res.status(200).json(cards)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erreur serveur' })
  }
}