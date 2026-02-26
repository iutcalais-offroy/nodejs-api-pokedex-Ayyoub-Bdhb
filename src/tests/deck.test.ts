import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock } from './vitest.setup'
import { PokemonType } from '../generated/prisma/client'
import {
    createDeckService,
    getDeckByIdService,
    updateDeckService,
    deleteDeckService,
} from '../services/deck.service'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Service des decks', () => {
    const deckFaux = {
        id: 1,
        name: 'MonDeck',
        userId: 1,
        cards: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const makeCard = (id: number) => ({
        id,
        name: `Card${id}`,
        hp: 10,
        attack: 5,
        type: PokemonType.Normal,
        pokedexNumber: id,
        imgUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    it('devrait créer un deck', async () => {
        const cards = Array.from({ length: 10 }, (_, i) => i + 1)
        const makeCard = (id: number) => ({
            id,
            name: `Card${id}`,
            hp: 10,
            attack: 5,
            type: PokemonType.Normal,
            pokedexNumber: id,
            imgUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        prismaMock.card.findMany.mockResolvedValue(cards.map((id) => makeCard(id)))
        prismaMock.deck.create.mockResolvedValue({ ...deckFaux, id: 1, userId: 1 })
        prismaMock.deckCard.createMany.mockResolvedValue({ count: 10 })

        const deckResultat = await createDeckService({ name: 'MonDeck', cards, userId: 1 })
        expect(deckResultat.name).toBe('MonDeck')
    })

    it('devrait récupérer un deck', async () => {
        prismaMock.deck.findUnique.mockResolvedValue({ ...deckFaux, userId: 1 })
        const deckResultat = await getDeckByIdService(1, 1)
        expect(deckResultat?.name).toBe('MonDeck')
    })

    it('devrait mettre à jour un deck', async () => {
        const cards = Array.from({ length: 10 }, (_, i) => i + 1)
        prismaMock.deck.findUnique.mockResolvedValue({ ...deckFaux, userId: 1 })
        prismaMock.card.findMany.mockResolvedValue(cards.map((id) => makeCard(id)))
        prismaMock.deckCard.deleteMany.mockResolvedValue({ count: 0 })
        prismaMock.deckCard.createMany.mockResolvedValue({ count: 10 })
        prismaMock.deck.update.mockResolvedValue({ ...deckFaux, name: 'DeckMisAJour', userId: 1 })
        prismaMock.deck.findUnique.mockResolvedValue({ ...deckFaux, name: 'DeckMisAJour', userId: 1 })

        const deckResultat = await updateDeckService(1, 1, 'DeckMisAJour', cards)
        expect((deckResultat as { name: string }).name).toBe('DeckMisAJour')
    })

    it('devrait supprimer un deck', async () => {
        prismaMock.deck.findUnique.mockResolvedValue({ ...deckFaux, userId: 1 })
        prismaMock.deckCard.deleteMany.mockResolvedValue({ count: 10 })
        prismaMock.deck.delete.mockResolvedValue(deckFaux)

        await deleteDeckService(1, 1)
        expect(prismaMock.deck.delete).toHaveBeenCalled()
    })

    it("la création échoue si le nom est manquant", async () => {
        const cards = Array.from({ length: 10 }, (_, i) => i + 1)
        await expect(createDeckService({ name: '', cards, userId: 1 })).rejects.toBeInstanceOf(Error)
    })

    it("la création échoue si le nombre de cartes est incorrect", async () => {
        const cards = [1, 2, 3]
        await expect(createDeckService({ name: 'A', cards, userId: 1 })).rejects.toBeInstanceOf(Error)
    })

    it("la création échoue si des cartes sont invalides", async () => {
        const cards = Array.from({ length: 10 }, (_, i) => i + 1)
        prismaMock.card.findMany.mockResolvedValue(cards.slice(0, 5).map((id) => makeCard(id)))
        await expect(createDeckService({ name: 'A', cards, userId: 1 })).rejects.toBeInstanceOf(Error)
    })

    it("récupération échoue si non trouvé ou accès interdit", async () => {
        prismaMock.deck.findUnique.mockResolvedValue(null)
        await expect(getDeckByIdService(1, 1)).rejects.toBeInstanceOf(Error)

        prismaMock.deck.findUnique.mockResolvedValue({ ...deckFaux, userId: 2 })
        await expect(getDeckByIdService(1, 1)).rejects.toBeInstanceOf(Error)
    })

    it("la mise à jour échoue si non trouvé, interdit ou cartes invalides", async () => {
        // non trouvé
        prismaMock.deck.findUnique.mockResolvedValue(null)
        await expect(updateDeckService(1, 1, 'X', [])).rejects.toBeInstanceOf(Error)

        // accès interdit
        prismaMock.deck.findUnique.mockResolvedValue({ ...deckFaux, userId: 2 })
        await expect(updateDeckService(1, 1, 'X', [])).rejects.toBeInstanceOf(Error)

        // longueur invalide des cartes
        prismaMock.deck.findUnique.mockResolvedValue({ ...deckFaux, userId: 1 })
        await expect(updateDeckService(1, 1, undefined, [1, 2])).rejects.toBeInstanceOf(Error)
    })

    it("la suppression échoue si non trouvé ou accès interdit", async () => {
        prismaMock.deck.findUnique.mockResolvedValue(null)
        await expect(deleteDeckService(1, 1)).rejects.toBeInstanceOf(Error)

        prismaMock.deck.findUnique.mockResolvedValue({ ...deckFaux, userId: 2 })
        await expect(deleteDeckService(1, 1)).rejects.toBeInstanceOf(Error)
    })
})