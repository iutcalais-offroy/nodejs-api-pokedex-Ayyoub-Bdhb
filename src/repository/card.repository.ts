import { prisma } from './../database'
import { Card } from './../generated/prisma/client'

/**
 * Récupère toutes les cartes Pokémon.
 *
 * Les cartes sont triées par numéro de Pokédex croissant.
 *
 * @returns {Promise<Card[]>} Liste des cartes.
 */
export function findAllCards(): Promise<Card[]> {
  return prisma.card.findMany({
    orderBy: {
      pokedexNumber: 'asc',
    },
  })
}

/**
 * Récupère plusieurs cartes à partir d'une liste d'identifiants.
 *
 * @param {number[]} cardIds - Liste des identifiants des cartes.
 * @returns {Promise<Card[]>} Liste des cartes correspondantes.
 */
export function findCardsByIds(cardIds: number[]): Promise<Card[]> {
  return prisma.card.findMany({
    where: {
      id: {
        in: cardIds,
      },
    },
  })
}