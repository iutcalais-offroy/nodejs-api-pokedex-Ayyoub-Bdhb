import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
    createDeckController,
    getMyDecksController,
    getDeckByIdController,
    updateDeckController,
    deleteDeckController,
} from '../controllers/deck.controller'

const router = Router()

router.use(authenticate)

router.post('/', createDeckController)
router.get('/mine', getMyDecksController)
router.get('/:id', getDeckByIdController)
router.patch('/:id', updateDeckController)
router.delete('/:id', deleteDeckController)

export default router
