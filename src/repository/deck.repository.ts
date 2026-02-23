import { prisma } from '../database'

export function createDeck(name: string, userId: number) {
    return prisma.deck.create({
        data: {
            name,
            userId,
        },
    })
}

export function addCardsToDeck(deckId: number, cardIds: number[]) {
    return prisma.deckCard.createMany({
        data: cardIds.map((cardId) => ({
            deckId,
            cardId,
        })),
    })
}

export function findDecksByUser(userId: number) {
    return prisma.deck.findMany({
        where: { userId },
        include: {
            deckCards: {
                include: {
                    card: true,
                },
            },
        },
    })
}

export function findDeckById(deckId: number) {
    return prisma.deck.findUnique({
        where: { id: deckId },
        include: {
            deckCards: {
                include: {
                    card: true,
                },
            },
        },
    })
}

export function updateDeckName(deckId: number, name: string) {
    return prisma.deck.update({
        where: { id: deckId },
        data: { name },
    })
}

export function removeCardsFromDeck(deckId: number) {
    return prisma.deckCard.deleteMany({
        where: { deckId },
    })
}

export function deleteDeck(deckId: number) {
    return prisma.deck.delete({
        where: { id: deckId },
    })
}
