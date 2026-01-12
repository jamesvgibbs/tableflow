// Simple hardcoded admin credentials
// In production, use environment variables and proper hashing
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "seatherder123",
}

export function validateCredentials(username: string, password: string): boolean {
  return (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  )
}

// Session token for cookie-based auth
export function generateSessionToken(): string {
  return crypto.randomUUID()
}

// Cookie name for session
export const SESSION_COOKIE_NAME = "seatherder_session"
