import { useAdmin } from '@/contexts/admin-context'
import { User } from '@/types'

export function useUserResolver() {
  const { config } = useAdmin()

  const getUserById = (userId: string): User | null => {
    const userConfig = config.users.find(u => u.id === userId)
    if (!userConfig) return null

    return {
      id: userConfig.id,
      name: userConfig.name,
      email: userConfig.email,
      role: userConfig.role,
      avatar: userConfig.avatar
    }
  }

  const getUsersById = (userIds: string[]): User[] => {
    return userIds.map(id => getUserById(id)).filter(Boolean) as User[]
  }

  return { getUserById, getUsersById }
}
