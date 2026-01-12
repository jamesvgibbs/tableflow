import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME } from "@/lib/auth"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

    return NextResponse.json({
      isAuthenticated: !!sessionToken?.value,
    })
  } catch {
    return NextResponse.json(
      { isAuthenticated: false },
      { status: 500 }
    )
  }
}
