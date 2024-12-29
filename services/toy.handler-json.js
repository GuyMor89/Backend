import fs from 'fs'

import { utilHandler } from './util.service.js'

const toys = utilHandler.readJsonFile('data/toys.json')
const PAGE_SIZE = 4

export const toyHandler = {
    query,
    getById,
    remove,
    save,
    hasToys
}

async function query(filterBy = {}) {
    let filteredToys = toys
    // const sort = JSON.parse(filterBy.sort)

    let { sort } = filterBy
    
    // try {
    //     sort = filterBy.sort ? JSON.parse(filterBy.sort) : null
    // } catch (error) {
    //     console.error('Invalid JSON in filterBy.sort:', error)
    //     sort = null
    // }    

    if (filterBy.name) {
        const regExp = new RegExp(filterBy.name, 'i')
        filteredToys = filteredToys.filter(toy => regExp.test(toy.name) || (toy.labels && toy.labels.some(label => regExp.test(label))))
    }
    if (filterBy.minPrice) {
        filteredToys = filteredToys.filter(toy => toy.price >= +filterBy.minPrice)
    }

    if (sort && sort.price) {
        filteredToys = filteredToys.sort((a, b) => (a.price - b.price) * sort.price)
    }
    if (sort && sort.name) {
        filteredToys = filteredToys.sort((a, b) => (a.name.localeCompare(b.name)) * sort.name)
    }
    if (sort && sort.createdAt) {
        filteredToys = filteredToys.sort((a, b) => (a.createdAt - b.createdAt) * sort.createdAt)
    }

    const amountOfToys = filteredToys.length

    if (filterBy.page) {
        const pageStart = (filterBy.page * PAGE_SIZE)

        filteredToys = filteredToys.slice(pageStart, pageStart + PAGE_SIZE)
    }
    return { filteredToys, amountOfToys }
}

async function getById(toyID) {
    const toy = toys.find(toy => toy._id === toyID)
    if (!toy) throw 'Cannot find toy - ' + toyID
    return toy
}

async function remove(toyID, user) {
    const toyIDx = toys.findIndex(toy => toy._id === toyID)
    if (toyIDx < 0) throw 'Cannot find toy - ' + toyID

    if (toys[toyIDx].owner && toys[toyIDx].owner._id !== user._id && !user.isAdmin) {
        throw 'Not authorized to delete this toy'
    }

    toys.splice(toyIDx, 1)
    return _saveToysToFile()
}

function save(data, user) {
    let toyToSave

    if (data._id) {
        const toyIDx = toys.findIndex(toy => toy._id === data._id)
        if (toyIDx === -1) return Promise.reject('Couldn\'t find toy ID')

        if (toys[toyIDx].owner && toys[toyToSave].owner._id !== user._id && !user.isAdmin) {
            return Promise.reject('Not authorized to update this toy')
        }

        toyToSave = {
            _id: data._id,
            createdAt: data.createdAt,
            updatedAt: Date.now(),
            name: data.name,
            price: +data.price,
            labels: data.labels,
            owner: data.owner,
            inStock: data.inStock
        }

        toys[toyIDx] = toyToSave

    } else {
        const labels = []

        function getLabels() {
            const stockLabels = ['On wheels', 'Box game', 'Art', 'Baby', 'Doll', 'Puzzle',
                'Outdoor', 'Battery Powered']

            const labelIDx = utilHandler.getRandomIntInclusive(0, 8)
            labels.push(...stockLabels.splice(labelIDx, 1))
        }

        let numberOfLabels = utilHandler.getRandomIntInclusive(1, 3)
        while (numberOfLabels-- > 0) {
            getLabels()
        }

        toyToSave = {
            _id: utilHandler.makeId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            name: data.name,
            price: +data.price,
            owner: data.owner,
            labels,
            inStock: Math.random() < 0.5 ? true : false
        }

        toys.unshift(toyToSave)
    }
    return _saveToysToFile()
        .then(() => toyToSave)
}

function hasToys(userID) {
    const hasToys = toys.some(toy => toy.owner && toy.owner._id === userID)

    if (hasToys) return Promise.reject('Cannot delete user with toys')

    return Promise.resolve()
}

function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 4)
        fs.writeFile('data/toys.json', data, (err) => {
            if (err) {
                return reject(err)
            }
            resolve()
        })
    })
}