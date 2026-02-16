import { findAllCards } from '../repository/card.repository'

export const getAllCards = async () => {
  try {
    return await findAllCards()
  } catch {
    throw { status: 500, message: 'Erreur serveur.' }
  }
}
