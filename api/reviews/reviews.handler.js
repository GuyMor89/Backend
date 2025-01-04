import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

import { ObjectId } from 'mongodb'

export const reviewHandler = {
    get,
    getFull,
    add,
    remove
}

async function get() {
    try {
        const collection = await dbService.getCollection('reviews')
        const reviews = await collection.find().toArray()
        return reviews
    } catch (err) {
        console.log('ERROR: cannot find toys')
        throw err
    }
}

async function getFull(filterBy = {}) {
    try {
        // const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('reviews')

        var reviews = await collection.aggregate([
            // {
            //     $match: criteria,
            // },
            {
                $lookup: {
                    localField: 'toyID',
                    from: 'toys',
                    foreignField: '_id',
                    as: 'toy',
                },
            },
            {
                $unwind: '$toy',
            },
            {
                $lookup: {
                    localField: 'userID',
                    from: 'users',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: '$user',
            },
            {
                $project: {
                    'text': true,
                    'toy._id': true,
                    'toy.name': true,
                    'user._id': true,
                    'user.fullname': true,
                }
            }
        ]).toArray()

        return reviews
    } catch (err) {
        logger.error('cannot get reviews', err)
        throw err
    }
}

async function add({ loggedinUser, params, body }) {
    const toyID = params.id
    const userID = loggedinUser._id
    const text = body.review

    try {
        const reviewToAdd = {
            userID: ObjectId.createFromHexString(userID),
            toyID: ObjectId.createFromHexString(toyID),
            text
        }

        const collection = await dbService.getCollection('reviews')
        await collection.insertOne(reviewToAdd)
        return reviewToAdd
    } catch (err) {
        logger.error('cannot insert review', err)
        throw err
    }
}

async function remove(reviewID) {
	try {
		const collection = await dbService.getCollection('reviews')
        const { deletedCount } = await collection.deleteOne({_id: ObjectId.createFromHexString(reviewID)})
        console.log(deletedCount)
        return deletedCount
    } catch (err) {
		logger.error(`cannot remove toy ${reviewID}`, err)
		throw err
	}
}