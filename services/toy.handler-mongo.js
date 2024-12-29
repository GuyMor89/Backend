import { ObjectId } from 'mongodb'
import { dbService } from './db.service.js'

const PAGE_SIZE = 4

export const toyHandlerMongo = {
    query,
    getById,
    remove,
    update,
    add
}

async function query(filterBy = {}) {

    const PAGE_SIZE = 4 // Number of items per page
    const page = filterBy.page || 0 // Default to the first page
    const criteria = {}

    // Add filtering criteria
    if (filterBy.minPrice) {
        criteria.price = { $gte: +filterBy.minPrice }
    }
    if (filterBy.name) {
        criteria.name = { $regex: filterBy.name, $options: 'i' }
    }

    const collection = await dbService.getCollection('toys')

    // Step 1: Count matching documents
    const totalToys = await collection.countDocuments(criteria)
    console.log(`Total matching toys: ${totalToys}`)

    try {
        // Step 2: Apply pagination
        const skip = page * PAGE_SIZE; // Calculate the number of documents to skip
        const paginatedToys = await collection.find(criteria)
            .skip(skip)
            .limit(PAGE_SIZE)
            .toArray()

        console.log(`Paginated toys:`, paginatedToys)

        return { filteredToys: paginatedToys, amountOfToys: totalToys }
    } catch (err) {
        console.log('ERROR: cannot find toys')
        throw err
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toys')
        return await collection.findOne({
            _id: ObjectId.isValid(toyId) ? ObjectId.createFromHexString(toyId) : toyId
        })
    } catch (err) {
        console.log(`ERROR: cannot find toy ${toyId}`)
        throw err
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toys')
        return await collection.deleteOne({ _id: ObjectId.isValid(toyId) ? ObjectId.createFromHexString(toyId) : toyId })
    } catch (err) {
        console.log(`ERROR: cannot remove toy ${toyId}`)
        throw err
    }
}

async function update(toy) {
    try {
        const collection = await dbService.getCollection('toys')
        await collection.updateOne({ _id: toy._id }, { $set: toy })
        return toy
    } catch (err) {
        console.log(`ERROR: cannot update toy ${toy._id}`)
        throw err
    }
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toys')
        await collection.insertOne(toy)
        console.log('toy', toy)

        return toy
    } catch (err) {
        console.log(`ERROR: cannot insert toy`)
        throw err
    }
}