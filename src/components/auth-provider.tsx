"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session")
        const data = await response.json()
        setIsAuthenticated(data.isAuthenticated)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })

        if (response.ok) {
          setIsAuthenticated(true)
          return true
        }
        return false
      } catch {
        return false
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      setIsAuthenticated(false)
      router.push("/")
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
