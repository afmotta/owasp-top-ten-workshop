import { hash, compare } from 'bcrypt'

const saltRounds = 10

export async function encryptPassword(password) {
  return await hash(password, saltRounds)
}

export async function comparePassword(password, hash) {
  return await compare(password, hash)
}
