import { reviewHandler } from './reviews.handler.js'
import { logger } from '../../services/logger.service.js'
import { broadcastUserAddedReview, broadcastUserRemovedReview } from '../../services/socket.service.js'

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
        broadcastUserAddedReview(addedReview, req.loggedinUser)
        res.json(addedReview)
    } catch (err) {
        logger.error('Failed to add review', err)
        res.status(500).send({ err: 'Failed to add review' })
    }
}

export async function removeReview(req, res) {
    const { loggedinUser } = req
    const { id } = req.params

    try {
        const deletedCount = await reviewHandler.remove(id)
        if (deletedCount === 1) {
            broadcastUserRemovedReview(id, loggedinUser._id)
            res.send({ msg: 'Deleted successfully' })
        } else {
            res.status(400).send({ err: 'Cannot remove review' })
        }
        // res.json(id)
    } catch (err) {
        logger.error('Failed to remove review', err)
        res.status(400).send({ err: 'Failed to remove review' })
    }
}


