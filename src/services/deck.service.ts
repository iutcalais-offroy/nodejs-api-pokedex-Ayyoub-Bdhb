import { HttpError } from '../errors/HttpError'
import {
    createDeck,
    addCardsToDeck,
    findDeckById,
    findDecksByUser,
    deleteDeck,
    updateDeckName,
    removeCardsFromDeck,
} from '../repository/deck.repository'
import { findCardsByIds } from '../repository/card.repository'

interface CreateDeckPayload {
    name: string
    cards: number[]
    userId: number
}

/**
 * Crée un nouveau deck pour un utilisateur.
 *
 * Vérifie que le nom est renseigné et que le deck contient exactement 10 cartes valides.
 * Associe ensuite les cartes au deck créé.
 *
 * @param {CreateDeckPayload} payload - Données nécessaires à la création du deck.
 * @returns {Promise<any>} Le deck créé avec ses cartes.
 *
 * @throws {HttpError} 400 - Si le nom est manquant ou si les cartes sont invalides.
 */
export async function createDeckService(payload: CreateDeckPayload) {
    const { name, cards, userId } = payload

    if (!name) {
        throw new HttpError(400, 'Le nom du deck est obligatoire')
    }

    if (!Array.isArray(cards) || cards.length !== 10) {
        throw new HttpError(400, 'Un deck doit contenir exactement 10 cartes')
    }

    const existingCards = await findCardsByIds(cards)
    if (existingCards.length !== 10) {
        throw new HttpError(400, 'Certaines cartes sont invalides ou inexistantes')
    }

    const deck = await createDeck(name, userId)
    await addCardsToDeck(deck.id, cards)

    return {
        ...deck,
        cards: existingCards,
    }
}

/**
 * Récupère tous les decks appartenant à un utilisateur.
 *
 * @param {number} userId - Identifiant de l'utilisateur connecté.
 * @returns {Promise<any[]>} Liste des decks de l'utilisateur.
 */
export async function getMyDecksService(userId: number) {
    return findDecksByUser(userId)
}

/**
 * Récupère un deck par son identifiant.
 *
 * Vérifie que le deck existe et qu'il appartient bien à l'utilisateur.
 *
 * @param {number} deckId - Identifiant du deck.
 * @param {number} userId - Identifiant de l'utilisateur connecté.
 * @returns {Promise<any>} Le deck demandé.
 *
 * @throws {HttpError} 404 - Si le deck est introuvable.
 * @throws {HttpError} 403 - Si l'accès est interdit.
 */
export async function getDeckByIdService(deckId: number, userId: number) {
    const deck = await findDeckById(deckId)

    if (!deck) {
        throw new HttpError(404, 'Deck introuvable')
    }

    if (deck.userId !== userId) {
        throw new HttpError(403, 'Accès interdit')
    }

    return deck
}

/**
 * Met à jour un deck existant.
 *
 * Permet de modifier le nom et/ou les cartes.
 *
 * @param {number} deckId - Identifiant du deck.
 * @param {number} userId - Identifiant de l'utilisateur connecté.
 * @param {string} [name] - Nouveau nom du deck .
 * @param {number[]} [cards] - Nouvelle liste de cartes.
 * @returns {Promise<any>} Le deck mis à jour.
 *
 * @throws {HttpError} 404 - Si le deck est introuvable.
 * @throws {HttpError} 403 - Si l'accès est interdit.
 * @throws {HttpError} 400 - Si les cartes sont invalides.
 */
export async function updateDeckService(
    deckId: number,
    userId: number,
    name?: string,
    cards?: number[],
) {
    const deck = await findDeckById(deckId)

    if (!deck) {
        throw new HttpError(404, 'Deck introuvable')
    }

    if (deck.userId !== userId) {
        throw new HttpError(403, 'Accès interdit')
    }

    if (cards) {
        if (cards.length !== 10) {
            throw new HttpError(400, 'Un deck doit contenir exactement 10 cartes')
        }

        const existingCards = await findCardsByIds(cards)
        if (existingCards.length !== 10) {
            throw new HttpError(400, 'Cartes invalides')
        }

        await removeCardsFromDeck(deckId)
        await addCardsToDeck(deckId, cards)
    }

    if (name) {
        await updateDeckName(deckId, name)
    }

    return findDeckById(deckId)
}

/**
 * Supprime un deck.
 *
 * Vérifie que le deck existe et qu'il appartient à l'utilisateur avant suppression.
 *
 * @param {number} deckId - Identifiant du deck.
 * @param {number} userId - Identifiant de l'utilisateur connecté.
 * @returns {Promise<void>}
 *
 * @throws {HttpError} 404 - Si le deck est introuvable.
 * @throws {HttpError} 403 - Si l'accès est interdit.
 */
export async function deleteDeckService(deckId: number, userId: number) {
    const deck = await findDeckById(deckId)

    if (!deck) {
        throw new HttpError(404, 'Deck introuvable')
    }

    if (deck.userId !== userId) {
        throw new HttpError(403, 'Accès interdit')
    }

    await removeCardsFromDeck(deckId)
    await deleteDeck(deckId)
}