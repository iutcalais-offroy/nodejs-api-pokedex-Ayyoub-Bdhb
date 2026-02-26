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

describe('Dépôt des cartes', () => {
    const carteFausse: CardType = {
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

    it('devrait retourner toutes les cartes', async () => {
        prismaMock.card.findMany.mockResolvedValue([carteFausse])

        const cartes = await findAllCards()
        expect(cartes.length).toBe(1)
        expect(cartes[0].name).toBe('Pikachu')
        expect(cartes[0].type).toBe(PokemonType.Electric)
    })
})