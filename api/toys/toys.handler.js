import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

export const toyHandler = {
	remove,
	query,
	getById,
	add,
	update,
	addToyMsg,
	removeToyMsg,
}

async function query(filterBy = {}) {

	const PAGE_SIZE = 4
	const page = filterBy.page || 0
	const criteria = {}

	if (filterBy.minPrice) {
		criteria.price = { $gte: +filterBy.minPrice }
	}
	if (filterBy.name) {
		criteria.name = { $regex: filterBy.name, $options: 'i' }
	}

	function handleSort() {
		for (const key in filterBy.sort) {
			const value = filterBy.sort[key]
			if (value !== '') {
				return { [key]: value }
			}
		}
	}

	try {
		const collection = await dbService.getCollection('toys')

		const totalToys = await collection.countDocuments(criteria)
		const unfilteredToys = await collection.find().toArray()

		const skip = page * PAGE_SIZE
		const paginatedToys = await collection.find(criteria)
			.sort(handleSort())
			.skip(skip)
			.limit(PAGE_SIZE)
			.toArray()

		return { filteredToys: paginatedToys, amountOfToys: totalToys, unfilteredToys: unfilteredToys }

	} catch (err) {
		console.log('ERROR: cannot find toys')
		throw err
	}
}

async function getById(toyId) {
	try {
		const collection = await dbService.getCollection('toys')
		const toy = await collection.findOne({ _id: ObjectId.isValid(toyId) ? ObjectId.createFromHexString(toyId) : toyId })

		toy.createdAt = toy.updatedAt = toy._id.getTimestamp()
		return toy
	} catch (err) {
		logger.error(`while finding toy ${toyId}`, err)
		throw err
	}
}

async function remove(toyId) {
	try {
		const collection = await dbService.getCollection('toys')
		const { deletedCount } = await collection.deleteOne({ _id: ObjectId.isValid(toyId) ? ObjectId.createFromHexString(toyId) : toyId })
		return deletedCount
	} catch (err) {
		logger.error(`cannot remove toy ${toyId}`, err)
		throw err
	}
}

async function add(toy) {
	try {
		const labels = []

		function getLabels() {
			const stockLabels = ['On wheels', 'Box game', 'Art', 'Baby', 'Doll', 'Puzzle',
				'Outdoor', 'Battery Powered']

			const labelIDx = utilService.getRandomIntInclusive(0, 8)
			labels.push(...stockLabels.splice(labelIDx, 1))
		}

		let numberOfLabels = utilService.getRandomIntInclusive(1, 3)
		while (numberOfLabels-- > 0) {
			getLabels()
		}

		const toyToSave = {
			name: toy.name,
			price: +toy.price,
			owner: toy.owner,
			labels,
			inStock: Math.random() < 0.5 ? true : false
		}

		const collection = await dbService.getCollection('toys')
		await collection.insertOne(toyToSave)
		return toyToSave
	} catch (err) {
		logger.error('cannot insert toy', err)
		throw err
	}
}

async function update(toy) {
	try {
		const toyToSave = {
			// _id: toy._id,
			_id: ObjectId.createFromHexString(toy._id),
			updatedAt: Date.now(),
			name: toy.name,
			price: +toy.price,
			labels: toy.labels,
			owner: toy.owner,
			inStock: toy.inStock
		}
		const collection = await dbService.getCollection('toys')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toy._id) }, { $set: toyToSave })
		return toy
	} catch (err) {
		logger.error(`cannot update toy ${toy._id}`, err)
		throw err
	}
}

async function addToyMsg(toyId, msg) {
	try {
		msg.id = utilService.makeId()

		const collection = await dbService.getCollection('toys')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $push: { msgs: msg } })
		return msg
	} catch (err) {
		logger.error(`cannot add toy msg ${toyId}`, err)
		throw err
	}
}

async function removeToyMsg(toyId, msgId) {
	try {
		const collection = await dbService.getCollection('toys')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $pull: { msgs: { id: msgId } } })
		return msgId
	} catch (err) {
		logger.error(`cannot add toy msg ${toyId}`, err)
		throw err
	}
}