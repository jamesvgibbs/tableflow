"use client"

import { useState, useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "seatherder_sidebar_collapsed"

// Read from localStorage (client-side only)
function getStoredValue(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) === "true"
}

// Subscribe to storage changes (for cross-tab sync)
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

// Server snapshot (always false)
function getServerSnapshot(): boolean {
  return false
}

export function useSidebar() {
  // Use useSyncExternalStore for localStorage to avoid effect setState warnings
  const storedCollapsed = useSyncExternalStore(subscribe, getStoredValue, getServerSnapshot)
  const [isCollapsed, setIsCollapsed] = useState(storedCollapsed)
  const isLoaded = true // Always loaded with useSyncExternalStore

  // Toggle collapse state and persist
  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const newValue = !prev
      localStorage.setItem(STORAGE_KEY, String(newValue))
      return newValue
    })
  }, [])

  // Explicitly set collapsed state
  const setCollapsed = useCallback((value: boolean) => {
    setIsCollapsed(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }, [])

  return {
    isCollapsed,
    isLoaded,
    toggle,
    setCollapsed,
  }
}
