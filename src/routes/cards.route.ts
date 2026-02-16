import { Router } from 'express'
import { getAllCardsController } from '../controllers/card.controller'

const router = Router()

router.get('/', getAllCardsController)

export default router
