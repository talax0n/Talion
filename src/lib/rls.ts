import { AsyncLocalStorage } from 'async_hooks'

export const userIdStorage = new AsyncLocalStorage<string>()

export async function withRLS<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  return userIdStorage.run(userId, fn)
}
