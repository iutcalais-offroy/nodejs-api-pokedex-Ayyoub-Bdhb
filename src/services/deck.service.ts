// src/services/deck.service.ts
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

export async function getMyDecksService(userId: number) {
    return findDecksByUser(userId)
}

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