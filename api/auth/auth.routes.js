import express from 'express'
import { login, verify, signup, logout } from './auth.controller.js'
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'

export const authRoutes = express.Router()

authRoutes.post('/login', login)
authRoutes.get('/verify', requireAuth, verify)
authRoutes.post('/signup', signup)
authRoutes.post('/logout', logout)