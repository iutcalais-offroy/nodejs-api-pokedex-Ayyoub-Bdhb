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

// Créer un deck
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

// Lister tous les decks de l'utilisateur connecté
export async function getMyDecksController(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.userId
        const decks = await getMyDecksService(userId)
        return res.status(200).json(decks)
    } catch {
        return res.status(500).json({ error: 'Erreur serveur' })
    }
}

// Consulter un deck par son ID
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

// Modifier un deck
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