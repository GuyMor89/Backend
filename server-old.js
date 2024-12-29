import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import cors from 'cors'

import { toyHandler } from './services/toy.handler-json.js'
import { userHandler } from './services/user.handler-json.js'
import { toyHandlerMongo } from './services/toy.handler-mongo.js'

const app = express()

// app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
    ],
    credentials: true,
}
app.use(cors(corsOptions))

// app.get('/', (req, res) => res.send('Hello there'))
app.listen(3030, () => console.log('Server ready at port 3030'))

app.get('/favicon.ico', (req, res) => res.status(204))

app.get('/api/toy', (req, res) => {

    toyHandlerMongo.query(req.query)
        .then(toys => res.send(toys))
        .catch(err => {
            // loggerService.error('Cannot get toys', err)
            res.status(500).send('Cannot get toys')
        })
})

app.get('/api/toy/pdf', (req, res) => {
    toyHandler.setupPDF()
})

app.get('/api/toy/:toyID', (req, res) => {
    const { toyID } = req.params

    // let visitedToys = req.cookies.visitedToys || []

    // if (visitedToys.length === 2) return res.status(401).send('Wait for a bit')

    // const seenToysID = visitedToys.find(currentID => currentID === toyID)
    // if (!seenToysID) visitedToys.push(toyID)

    // res.cookie('visitedToys', visitedToys, { maxAge: 7 * 1000 })

    toyHandlerMongo.getById(toyID)
        .then(toy => res.send(toy))
        .catch(err => {
            // loggerService.error('Cannot get toy', err)
            res.status(500).send('Cannot get toy')
        })
})

app.post('/api/toy', (req, res) => {

    const user = userHandler.validateToken(req.cookies.loginToken)
    if (!user) return res.status(401).send('Not logged in')

    toyHandler.save(req.body, user)
        .then(savedToy => res.send(savedToy))
        .catch((err) => {
            // loggerService.error('Cannot save toy', err)
            res.status(500).send('Cannot add toy')
        })
})

app.put('/api/toy/:toyID', (req, res) => {

    const user = userHandler.validateToken(req.cookies.loginToken)
    if (!user) return res.status(401).send('Not logged in')

    if (!req.body.price || !req.body.name) return res.send('Cannot edit toy')

    toyHandler.save(req.body, user)
        .then(savedToy => res.send(savedToy))
        .catch((err) => {
            // loggerService.error('Cannot save toy', err)
            res.status(500).send('Cannot edit toy')
        })
})

app.delete('/api/toy/:toyID', (req, res) => {

    const user = userHandler.validateToken(req.cookies.loginToken)
    if (!user) return res.status(401).send('Not logged in')

    const { toyID } = req.params
    toyHandler.remove(toyID, user)
        .then(() => res.send('Toy removed successfully'))
        .catch(err => {
            // loggerService.error('Cannot get toy', err)
            res.status(500).send('Cannot delete toy')
        })
})

app.post('/api/auth/login', (req, res) => {

    userHandler.checkLogin(req.body)
        .then(user => {
            if (user) {
                const loginToken = userHandler.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(404).send('Invalid Credentials')
            }
        })
})

app.get('/api/user', (req, res) => {
    const user = userHandler.validateToken(req.cookies.loginToken)

    if (!user) return res.status(401).send('Not logged in')
    if (!user.isAdmin) return res.status(401).send('Not authorized to view users')

    userHandler.query()
        .then(users => res.send(users))
        .catch(() => res.status(500).send('Cannot get users'))
})

app.get('/api/user/:userID', (req, res) => {
    const user = userHandler.validateToken(req.cookies.loginToken)

    if (!user) return res.status(401).send('Not logged in')
    if (!user.isAdmin) return res.status(401).send('Not authorized to view users')

    const { userID } = req.params

    userHandler.getById(userID)
        .then(user => res.send(user))
        .catch(() => res.status(500).send('Cannot get user'))
})

app.delete('/api/user/:userID', (req, res) => {
    const user = userHandler.validateToken(req.cookies.loginToken)

    if (!user) return res.status(401).send('Not logged in')
    if (!user.isAdmin) return res.status(401).send('Not authorized to view users')

    const { userID } = req.params

    toyHandler.hasToys(userID)
        .then(() => userHandler.remove(userID))
        .then(() => res.send('Removed!'))
        .catch((err) => {
            if (err === 'Cannot delete user with toys') {
                res.status(403).send('Cannot delete user with toys')
            } else {
                res.status(500).send('An unexpected error occurred')
            }
        })
})

app.get('/api/auth/verify', (req, res) => {
    const user = userHandler.validateToken(req.cookies.loginToken)

    if (user) return res.send(user)
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body

    userHandler.save(credentials)
        .then(user => {
            if (user) {
                const loginToken = userHandler.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(400).send('Cannot signup')
            }
        })
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

