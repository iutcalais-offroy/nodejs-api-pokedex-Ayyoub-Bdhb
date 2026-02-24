import { Router } from 'express'
import { getAllCardsController } from '../controllers/card.controller'

/**
 * Route dédié aux cartes Pokémon.
 *
 * Permet la consultation des cartes disponibles.
 */
const router = Router()

/**
 * GET /
 *
 * Récupère la liste complète des cartes Pokémon.
 *
 * @route GET /cards
 */
router.get('/', getAllCardsController)

export default router