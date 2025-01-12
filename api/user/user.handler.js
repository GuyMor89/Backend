import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'

import { ObjectId } from 'mongodb'

export const userHandler = {
	query,
	getById,
	getByUsername,
	remove,
	update,
	add,
}

async function query(filterBy = {}) {
	const criteria = _buildCriteria(filterBy)
	try {
		const collection = await dbService.getCollection('users')
		return await collection.aggregate([
			{
				$match: criteria
			},
			{
				$sort: { fullname: 1 }
			},
			{
				$project: {
					username: 1,
					createdAt: { $toLong: { $toDate: '$_id' } },
					fullname: 1,
					imgURL: 1,
					isAdmin: 1,
				}
			}
		]).toArray()
	} catch (err) {
		logger.error('cannot find users', err)
		throw err
	}
}

async function getById(userId) {
	try {
		const collection = await dbService.getCollection('users')
		const user = await collection.findOne({ _id: ObjectId.createFromHexString(userId) })
		delete user.password
		return user
	} catch (err) {
		logger.error(`while finding user ${userId}`, err)
		throw err
	}
}

async function getByUsername(username) {
	try {
		const collection = await dbService.getCollection('users')
		const user = await collection.findOne({ username })
		return user
	} catch (err) {
		logger.error(`while finding user ${username}`, err)
		throw err
	}
}

async function remove(userId) {
	try {
		const collection = await dbService.getCollection('users')
		await collection.deleteOne({ _id: ObjectId.createFromHexString(userId) })
	} catch (err) {
		logger.error(`cannot remove user ${userId}`, err)
		throw err
	}
}

async function update(user) {
	try {
		// peek only updatable fields!
		const userToSave = {
			_id: ObjectId.createFromHexString(user._id),
			username: user.username,
			fullname: user.fullname,
			imgURL: user.imgURL,
			score: user.score,
			isAdmin: user.isAdmin
		}
		console.log(userToSave)
		const collection = await dbService.getCollection('users')
		await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
		return userToSave
	} catch (err) {
		logger.error(`cannot update user ${user._id}`, err)
		throw err
	}
}

async function add(user) {
	try {
		const userToAdd = {
			username: user.username,
			password: user.password,
			fullname: user.fullname,
			score: user.score || 0,
		}
		const collection = await dbService.getCollection('users')
		await collection.insertOne(userToAdd)
		return userToAdd
	} catch (err) {
		logger.error('cannot insert user', err)
		throw err
	}
}

function _buildCriteria(filterBy) {
	const criteria = {}

	if (filterBy.txt) {
		const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
		criteria.$or = [
			{
				username: txtCriteria,
			},
			{
				fullname: txtCriteria,
			},
		]
	}
	if (filterBy.minBalance) {
		criteria.balance = { $gte: filterBy.minBalance }
	}
	return criteria
}
