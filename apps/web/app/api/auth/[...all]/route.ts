import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@openpass/auth'

export const { GET, POST } = toNextJsHandler(auth)
