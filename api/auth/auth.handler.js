import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userHandler } from '../user/user.handler.js'
import { logger } from '../../services/logger.service.js'

export const authHandler = {
    signup,
    login,
    getLoginToken,
    validateToken
}

const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234')

async function login(username, password) {
    logger.debug(`auth.service - login with username: ${username}`)

    const user = await userHandler.getByUsername(username)
    if (!user) throw new Error('Invalid username or password')

    const match = await bcrypt.compare(password, user.password)
    if (!match) throw new Error('Invalid username or password')

    delete user.password
    return user
}

async function signup(username, password, fullname) {
    const saltRounds = 10

    logger.debug(`auth.service - signup with username: ${username}, fullname: ${fullname}`)
    if (!username || !password || !fullname) throw new Error('Missing details')

    const hash = await bcrypt.hash(password, saltRounds)
    return userHandler.add({ username, password: hash, fullname })
}

function getLoginToken(user) {
    const userInfo = {_id : user._id, fullname: user.fullname, isAdmin: user.isAdmin}
    return cryptr.encrypt(JSON.stringify(userInfo))    
}

function validateToken(loginToken) {
    try {
        const json = cryptr.decrypt(loginToken)
        const loggedinUser = JSON.parse(json)
        return loggedinUser
    } catch(err) {
        console.log('Invalid login token')
    }
    return null
}