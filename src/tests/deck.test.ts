import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock } from './vitest.setup'
import {
    createDeckService,
    getDeckByIdService,
    updateDeckService,
    deleteDeckService,
} from '../services/deck.service'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Deck service', () => {
    const mockDeck = {
        id: 1,
        name: 'MyDeck',
        userId: 1,
        cards: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    it('should create a deck', async () => {
        const cards = Array.from({ length: 10 }, (_, i) => i + 1)
        prismaMock.card.findMany.mockResolvedValue(cards.map((id) => ({ id } as any)))
        prismaMock.deck.create.mockResolvedValue({ ...mockDeck, id: 1, userId: 1 })
        prismaMock.deckCard.createMany.mockResolvedValue({ count: 10 })

        const deck = await createDeckService({ name: 'MyDeck', cards, userId: 1 } as any)
        expect(deck.name).toBe('MyDeck')
    })

    it('should get a deck', async () => {
        prismaMock.deck.findUnique.mockResolvedValue({ ...mockDeck, userId: 1 })
        const deck = await getDeckByIdService(1, 1)
        expect(deck?.name).toBe('MyDeck')
    })

    it('should update a deck', async () => {
        const cards = Array.from({ length: 10 }, (_, i) => i + 1)
        prismaMock.deck.findUnique.mockResolvedValue({ ...mockDeck, userId: 1 })
        prismaMock.card.findMany.mockResolvedValue(cards.map((id) => ({ id } as any)))
        prismaMock.deckCard.deleteMany.mockResolvedValue({ count: 0 })
        prismaMock.deckCard.createMany.mockResolvedValue({ count: 10 })
        prismaMock.deck.update.mockResolvedValue({ ...mockDeck, name: 'UpdatedDeck', userId: 1 })
        prismaMock.deck.findUnique.mockResolvedValue({ ...mockDeck, name: 'UpdatedDeck', userId: 1 })

        const deck = await updateDeckService(1, 1, 'UpdatedDeck', cards)
        expect((deck as any).name).toBe('UpdatedDeck')
    })

    it('should delete a deck', async () => {
        prismaMock.deck.findUnique.mockResolvedValue({ ...mockDeck, userId: 1 })
        prismaMock.deckCard.deleteMany.mockResolvedValue({ count: 10 })
        prismaMock.deck.delete.mockResolvedValue(mockDeck)

        await deleteDeckService(1, 1)
        expect(prismaMock.deck.delete).toHaveBeenCalled()
    })

    it('create fails with missing name', async () => {
        const cards = Array.from({ length: 10 }, (_, i) => i + 1)
        await expect(createDeckService({ name: '', cards, userId: 1 } as any)).rejects.toBeInstanceOf(Error)
    })

    it('create fails with wrong card count', async () => {
        const cards = [1, 2, 3]
        await expect(createDeckService({ name: 'A', cards, userId: 1 } as any)).rejects.toBeInstanceOf(Error)
    })

    it('create fails with invalid cards', async () => {
        const cards = Array.from({ length: 10 }, (_, i) => i + 1)
        prismaMock.card.findMany.mockResolvedValue(cards.slice(0, 5).map((id) => ({ id } as any)))
        await expect(createDeckService({ name: 'A', cards, userId: 1 } as any)).rejects.toBeInstanceOf(Error)
    })

    it('get deck not found or forbidden', async () => {
        prismaMock.deck.findUnique.mockResolvedValue(null)
        await expect(getDeckByIdService(1, 1)).rejects.toBeInstanceOf(Error)

        prismaMock.deck.findUnique.mockResolvedValue({ ...mockDeck, userId: 2 })
        await expect(getDeckByIdService(1, 1)).rejects.toBeInstanceOf(Error)
    })

    it('update fails when not found or forbidden or invalid cards', async () => {
        // not found
        prismaMock.deck.findUnique.mockResolvedValue(null)
        await expect(updateDeckService(1, 1, 'X', [])).rejects.toBeInstanceOf(Error)

        // forbidden
        prismaMock.deck.findUnique.mockResolvedValue({ ...mockDeck, userId: 2 })
        await expect(updateDeckService(1, 1, 'X', [])).rejects.toBeInstanceOf(Error)

        // invalid cards length
        prismaMock.deck.findUnique.mockResolvedValue({ ...mockDeck, userId: 1 })
        await expect(updateDeckService(1, 1, undefined, [1, 2])).rejects.toBeInstanceOf(Error)
    })

    it('delete fails when not found or forbidden', async () => {
        prismaMock.deck.findUnique.mockResolvedValue(null)
        await expect(deleteDeckService(1, 1)).rejects.toBeInstanceOf(Error)

        prismaMock.deck.findUnique.mockResolvedValue({ ...mockDeck, userId: 2 })
        await expect(deleteDeckService(1, 1)).rejects.toBeInstanceOf(Error)
    })
})