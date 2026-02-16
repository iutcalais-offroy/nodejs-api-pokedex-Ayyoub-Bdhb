import { Request, Response } from 'express'
import { getAllCards } from '../services/card.service'

export const getAllCardsController = async (
  _req: Request,
  res: Response,
) => {
  try {
    const cards = await getAllCards()
    return res.status(200).json(cards)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
