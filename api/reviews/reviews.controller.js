import { reviewHandler } from './reviews.handler.js'
import { logger } from '../../services/logger.service.js'

export async function getReviews(req, res) {
    try {
        const reviews = await reviewHandler.get()
        res.json(reviews)
    } catch (err) {
        logger.error('Failed to get reviews', err)
        res.status(500).send({ err: 'Failed to get reviews' })
    }
}

export async function getFullReviews(req, res) {
    try {
        const fullReviews = await reviewHandler.getFull()
        res.json(fullReviews)
    } catch (err) {
        logger.error('Failed to get reviews', err)
        res.status(500).send({ err: 'Failed to get reviews' })
    }
}

export async function addReview(req, res) {
    try {
        const addedReview = await reviewHandler.add(req)
        res.json(addedReview)
    } catch (err) {
        logger.error('Failed to add review', err)
        res.status(500).send({ err: 'Failed to add review' })
    }
}

export async function removeReview(req, res) {
    const { id } = req.params
    try {
        await reviewHandler.remove(id)
        res.json(id)
    } catch (err) {
        logger.error('Failed to add review', err)
        res.status(500).send({ err: 'Failed to add review' })
    }
}


