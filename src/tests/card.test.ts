import { describe, it, expect } from 'vitest'
import { prismaMock } from './vitest.setup'
import { findAllCards } from '../repository/card.repository'
import { PokemonType } from '../generated/prisma/client'

type CardType = {
    id: number
    name: string
    hp: number
    attack: number
    type: PokemonType
    pokedexNumber: number
    imgUrl: string | null
    createdAt: Date
    updatedAt: Date
}

describe('Card repository', () => {
    const mockCard: CardType = {
        id: 1,
        name: 'Pikachu',
        hp: 35,
        attack: 55,
        type: PokemonType.Electric,
        pokedexNumber: 25,
        imgUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    it('should return all cards', async () => {
        prismaMock.card.findMany.mockResolvedValue([mockCard])

        const cards = await findAllCards()
        expect(cards.length).toBe(1)
        expect(cards[0].name).toBe('Pikachu')
        expect(cards[0].type).toBe(PokemonType.Electric)
    })
})