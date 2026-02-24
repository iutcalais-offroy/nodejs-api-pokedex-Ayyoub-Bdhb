import { prisma } from '../database'

/**
 * Crée un nouveau deck pour un utilisateur.
 *
 * @param {string} name - Nom du deck.
 * @param {number} userId - Identifiant du propriétaire du deck.
 * @returns {Promise<Deck>} Le deck créé.
 */
export function createDeck(name: string, userId: number) {
    return prisma.deck.create({
        data: {
            name,
            userId,
        },
    })
}

/**
 * Associe plusieurs cartes à un deck.
 *
 * @param {number} deckId - Identifiant du deck.
 * @param {number[]} cardIds - Liste des identifiants des cartes à ajouter.
 * @returns {Promise<Prisma.BatchPayload>} Résultat  d'insertion.
 */
export function addCardsToDeck(deckId: number, cardIds: number[]) {
    return prisma.deckCard.createMany({
        data: cardIds.map((cardId) => ({
            deckId,
            cardId,
        })),
    })
}

/**
 * Récupère tous les decks appartenant à un utilisateur,
 * avec leurs cartes associées.
 *
 * @param {number} userId - Identifiant de l'utilisateur.
 * @returns {Promise<Deck[]>} Liste des decks avec leurs cartes.
 */
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

/**
 * Récupère un deck par son identifiant,
 * avec ses cartes associées.
 *
 * @param {number} deckId - Identifiant du deck.
 * @returns {Promise<Deck | null>} Le deck trouvé ou null.
 */
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

/**
 * Met à jour le nom d'un deck.
 *
 * @param {number} deckId - Identifiant du deck.
 * @param {string} name - Nouveau nom du deck.
 * @returns {Promise<Deck>} Le deck mis à jour.
 */
export function updateDeckName(deckId: number, name: string) {
    return prisma.deck.update({
        where: { id: deckId },
        data: { name },
    })
}

/**
 * Supprime toutes les associations cartes/deck d'un deck.
 *
 * @param {number} deckId - Identifiant du deck.
 * @returns {Promise<Prisma.BatchPayload>} Résultat de la suppression.
 */
export function removeCardsFromDeck(deckId: number) {
    return prisma.deckCard.deleteMany({
        where: { deckId },
    })
}

/**
 * Supprime un deck de la base de données.
 *
 * @param {number} deckId - Identifiant du deck.
 * @returns {Promise<Deck>} Le deck supprimé.
 */
export function deleteDeck(deckId: number) {
    return prisma.deck.delete({
        where: { id: deckId },
    })
}