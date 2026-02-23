import { prisma } from './../database'
import { Card } from './../generated/prisma/client'

export function findAllCards(): Promise<Card[]> {
  return prisma.card.findMany({
    orderBy: {
      pokedexNumber: 'asc',
    },
  })
}

export function findCardsByIds(cardIds: number[]): Promise<Card[]> {
  return prisma.card.findMany({
    where: {
      id: {
        in: cardIds,
      },
    },
  })
}