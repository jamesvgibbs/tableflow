"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "seatherder_sidebar_collapsed"

// Listeners for state changes (allows triggering re-renders)
const listeners: Set<() => void> = new Set()

function emitChange() {
  listeners.forEach((listener) => listener())
}

// Read from localStorage (client-side only)
function getStoredValue(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) === "true"
}

// Subscribe to storage changes (for cross-tab sync and local updates)
function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  window.addEventListener("storage", callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener("storage", callback)
  }
}

// Server snapshot (always false)
function getServerSnapshot(): boolean {
  return false
}

export function useSidebar() {
  // Use useSyncExternalStore for localStorage - single source of truth
  const isCollapsed = useSyncExternalStore(subscribe, getStoredValue, getServerSnapshot)
  const isLoaded = true // Always loaded with useSyncExternalStore

  // Toggle collapse state and persist
  const toggle = useCallback(() => {
    const newValue = !getStoredValue()
    localStorage.setItem(STORAGE_KEY, String(newValue))
    emitChange()
  }, [])

  // Explicitly set collapsed state
  const setCollapsed = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value))
    emitChange()
  }, [])

  return {
    isCollapsed,
    isLoaded,
    toggle,
    setCollapsed,
  }
}
