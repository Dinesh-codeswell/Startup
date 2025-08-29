"use client"

/**
 * Cross-tab authentication synchronization utility
 * Ensures authentication state is consistent across all browser tabs
 */

type AuthSyncEvent = {
  type: 'AUTH_STATE_CHANGED' | 'SIGN_OUT' | 'SIGN_IN'
  userId?: string
  timestamp: number
}

class CrossTabAuthSync {
  private static instance: CrossTabAuthSync
  private listeners: Set<(event: AuthSyncEvent) => void> = new Set()
  private storageKey = 'auth_sync_event'
  private lastEventTimestamp = 0

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this))
      
      // Also listen for focus events to check for auth changes
      window.addEventListener('focus', this.handleWindowFocus.bind(this))
    }
  }

  static getInstance(): CrossTabAuthSync {
    if (!CrossTabAuthSync.instance) {
      CrossTabAuthSync.instance = new CrossTabAuthSync()
    }
    return CrossTabAuthSync.instance
  }

  /**
   * Broadcast an authentication event to all tabs
   */
  broadcastAuthEvent(type: AuthSyncEvent['type'], userId?: string) {
    if (typeof window === 'undefined') return

    const event: AuthSyncEvent = {
      type,
      userId,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(event))
      // Immediately remove it to trigger storage event in other tabs
      setTimeout(() => {
        localStorage.removeItem(this.storageKey)
      }, 100)
    } catch (error) {
      console.warn('Failed to broadcast auth event:', error)
    }
  }

  /**
   * Add a listener for authentication events from other tabs
   */
  addListener(callback: (event: AuthSyncEvent) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange(e: StorageEvent) {
    if (e.key !== this.storageKey || !e.newValue) return

    try {
      const event: AuthSyncEvent = JSON.parse(e.newValue)
      
      // Prevent processing the same event multiple times
      if (event.timestamp <= this.lastEventTimestamp) return
      this.lastEventTimestamp = event.timestamp

      console.log('Cross-tab auth event received:', event)
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in auth sync listener:', error)
        }
      })
    } catch (error) {
      console.warn('Failed to parse auth sync event:', error)
    }
  }

  /**
   * Handle window focus to check for auth state changes
   */
  private handleWindowFocus() {
    // Broadcast a general auth state check event
    this.broadcastAuthEvent('AUTH_STATE_CHANGED')
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this))
      window.removeEventListener('focus', this.handleWindowFocus.bind(this))
    }
    this.listeners.clear()
  }
}

export default CrossTabAuthSync

/**
 * Hook for using cross-tab auth synchronization in React components
 */
export function useCrossTabAuthSync() {
  const sync = CrossTabAuthSync.getInstance()
  
  return {
    broadcastSignIn: (userId: string) => sync.broadcastAuthEvent('SIGN_IN', userId),
    broadcastSignOut: () => sync.broadcastAuthEvent('SIGN_OUT'),
    broadcastAuthChange: (userId?: string) => sync.broadcastAuthEvent('AUTH_STATE_CHANGED', userId),
    addListener: (callback: (event: AuthSyncEvent) => void) => sync.addListener(callback)
  }
}