import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import {
    createDeckService,
    getMyDecksService,
    getDeckByIdService,
    updateDeckService,
    deleteDeckService,
} from '../services/deck.service'
import { HttpError } from '../errors/HttpError'

/**
 * Crée un nouveau deck pour l'utilisateur connecté.
 *
 * @param {AuthRequest} req - Requête avec userId dans req.user et body contenant name et cards.
 * @param {Response} res - Réponse HTTP pour renvoyer le deck créé.
 *
 * @returns {Promise<Response>} - Le deck créé avec les cartes associées.
 *
 * @throws {HttpError} - Si les données sont invalides (nom manquant ou cartes incorrectes).
 * @throws {500} - En cas d'erreur serveur.
 */
export async function createDeckController(req: AuthRequest, res: Response) {
    try {
        const { name, cards } = req.body
        const userId = req.user!.userId

        const deck = await createDeckService({ name, cards, userId })
        return res.status(201).json(deck)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message })
        }
        return res.status(500).json({ error: 'Erreur serveur' })
    }
}

/**
 * Récupère tous les decks de l'utilisateur connecté.
 *
 * @param {AuthRequest} req - Requête avec userId dans req.user.
 * @param {Response} res - Réponse HTTP pour renvoyer la liste des decks.
 *
 * @returns {Promise<Response>} - Liste des decks.
 *
 * @throws {500} - En cas d'erreur serveur.
 */
export async function getMyDecksController(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.userId
        const decks = await getMyDecksService(userId)
        return res.status(200).json(decks)
    } catch {
        return res.status(500).json({ error: 'Erreur serveur' })
    }
}

/**
 * Récupère un deck par son ID pour l'utilisateur connecté.
 *
 * @param {AuthRequest} req - Requête avec userId dans req.user et params.id pour l'ID du deck.
 * @param {Response} res - Réponse HTTP pour renvoyer le deck.
 *
 * @returns {Promise<Response>} - Le deck demandé.
 *
 * @throws {HttpError} - Si le deck n'existe pas ou si l'accès est interdit.
 * @throws {500} - En cas d'erreur serveur.
 */
export async function getDeckByIdController(req: AuthRequest, res: Response) {
    try {
        const deckId = Number(req.params.id)
        const userId = req.user!.userId

        const deck = await getDeckByIdService(deckId, userId)
        return res.status(200).json(deck)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message })
        }
        return res.status(500).json({ error: 'Erreur serveur' })
    }
}

/**
 * Met à jour un deck existant  pour l'utilisateur connecté.
 *
 * @param {AuthRequest} req - Requête avec userId dans req.user et params.id pour l'ID du deck.
 * @param {Response} res - Réponse HTTP pour renvoyer le deck mis à jour.
 *
 * @returns {Promise<Response>} - Le deck mis à jour.
 *
 * @throws {HttpError} - Si le deck n'existe pas, accès interdit ou cartes invalides.
 * @throws {500} - En cas d'erreur serveur.
 */
export async function updateDeckController(req: AuthRequest, res: Response) {
    try {
        const deckId = Number(req.params.id)
        const userId = req.user!.userId
        const { name, cards } = req.body

        const deck = await updateDeckService(deckId, userId, name, cards)
        return res.status(200).json(deck)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message })
        }
        return res.status(500).json({ error: 'Erreur serveur' })
    }
}

/**
 * Supprime un deck pour l'utilisateur connecté.
 *
 * @param {AuthRequest} req - Requête avec userId dans req.user et params.id pour l'ID du deck.
 * @param {Response} res - Réponse HTTP pour confirmer la suppression.
 *
 * @returns {Promise<Response>} - Message de succès.
 *
 * @throws {HttpError} - Si le deck n'existe pas ou si l'accès est interdit.
 * @throws {500} - En cas d'erreur serveur.
 */
export async function deleteDeckController(req: AuthRequest, res: Response) {
    try {
        const deckId = Number(req.params.id)
        const userId = req.user!.userId

        await deleteDeckService(deckId, userId)
        return res.status(200).json({ message: 'Deck supprimé' })
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message })
        }
        return res.status(500).json({ error: 'Erreur serveur' })
    }
}