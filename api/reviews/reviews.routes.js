import express from 'express'

import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'
import { getReviews, addReview, removeReview, getFullReviews } from './reviews.controller.js'

export const reviewRoutes = express.Router()

reviewRoutes.get('/', getReviews)
reviewRoutes.get('/full', getFullReviews)
reviewRoutes.post('/:id', requireAuth, addReview)
reviewRoutes.delete('/:id', requireAuth, removeReview)