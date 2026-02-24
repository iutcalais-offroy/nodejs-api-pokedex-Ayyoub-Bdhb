import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
    createDeckController,
    getMyDecksController,
    getDeckByIdController,
    updateDeckController,
    deleteDeckController,
} from '../controllers/deck.controller'

/**
 * Route dédié à la gestion des decks.
 *
 * Toutes les routes sont protégées par authentification JWT.
 */
const router = Router()

/**
 * Middleware d'authentification.
 *
 * Vérifie la validité du token JWT
 * avant d'autoriser l'accès aux routes suivantes.
 */
router.use(authenticate)

/**
 * POST /
 *
 * Crée un nouveau deck pour l'utilisateur authentifié.
 *
 * @route POST /decks
 */
router.post('/', createDeckController)

/**
 * GET /mine
 *
 * Récupère tous les decks appartenant à l'utilisateur connecté.
 *
 * @route GET /decks/mine
 */
router.get('/mine', getMyDecksController)

/**
 * GET /:id
 *
 * Récupère un deck spécifique par son identifiant.
 *
 * @route GET /decks/:id
 */
router.get('/:id', getDeckByIdController)

/**
 * PATCH /:id
 *
 * Met à jour un deck existant (nom et/ou cartes).
 *
 * @route PATCH /decks/:id
 */
router.patch('/:id', updateDeckController)

/**
 * DELETE /:id
 *
 * Supprime un deck appartenant à l'utilisateur.
 *
 * @route DELETE /decks/:id
 */
router.delete('/:id', deleteDeckController)

export default router