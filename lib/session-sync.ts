/**
 * Session Synchronization Utility
 * Handles cross-tab authentication state synchronization
 */

type SessionSyncCallback = (event: 'signin' | 'signout' | 'token_refresh') => void

class SessionSync {
  private callbacks: Set<SessionSyncCallback> = new Set()
  private isListening = false
  private lastTokenHash: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.startListening()
    }
  }

  /**
   * Add a callback to be notified of session changes
   */
  subscribe(callback: SessionSyncCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Start listening for storage events
   */
  private startListening() {
    if (this.isListening || typeof window === 'undefined') return

    this.isListening = true
    window.addEventListener('storage', this.handleStorageChange)
    window.addEventListener('focus', this.handleWindowFocus)
  }

  /**
   * Stop listening for storage events
   */
  stopListening() {
    if (!this.isListening || typeof window === 'undefined') return

    this.isListening = false
    window.removeEventListener('storage', this.handleStorageChange)
    window.removeEventListener('focus', this.handleWindowFocus)
  }

  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange = (event: StorageEvent) => {
    if (!event.key?.startsWith('sb-')) return

    console.log('Storage change detected:', event.key, event.newValue ? 'set' : 'removed')

    // Handle auth token changes
    if (event.key.includes('auth-token')) {
      if (event.newValue) {
        this.notifyCallbacks('signin')
      } else {
        this.notifyCallbacks('signout')
      }
    }

    // Handle session changes
    if (event.key.includes('session')) {
      this.notifyCallbacks('token_refresh')
    }
  }

  /**
   * Handle window focus events
   */
  private handleWindowFocus = () => {
    console.log('Window focused, checking for session changes')
    this.checkSessionChanges()
  }

  /**
   * Check for session changes by comparing token hashes
   */
  private checkSessionChanges = () => {
    if (typeof window === 'undefined') return

    try {
      // Get current auth token from localStorage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') && key.includes('auth-token')
      )
      
      const currentToken = authKeys.length > 0 ? localStorage.getItem(authKeys[0]) : null
      const currentHash = currentToken ? this.hashString(currentToken) : null

      if (currentHash !== this.lastTokenHash) {
        console.log('Session change detected via focus check')
        this.lastTokenHash = currentHash
        
        if (currentHash) {
          this.notifyCallbacks('token_refresh')
        } else {
          this.notifyCallbacks('signout')
        }
      }
    } catch (error) {
      console.error('Error checking session changes:', error)
    }
  }

  /**
   * Notify all callbacks of a session event
   */
  private notifyCallbacks(event: 'signin' | 'signout' | 'token_refresh') {
    this.callbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in session sync callback:', error)
      }
    })
  }

  /**
   * Simple hash function for comparing tokens
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  /**
   * Force a session sync check
   */
  forceSync() {
    this.checkSessionChanges()
  }

  /**
   * Broadcast a session event to other tabs
   */
  broadcastSessionEvent(event: 'signin' | 'signout') {
    if (typeof window === 'undefined') return

    const eventKey = `session-sync-${Date.now()}`
    localStorage.setItem(eventKey, event)
    
    // Clean up the event key after a short delay
    setTimeout(() => {
      localStorage.removeItem(eventKey)
    }, 1000)
  }
}

// Export singleton instance
export const sessionSync = new SessionSync()

// Export utility functions
export function useSessionSync(callback: SessionSyncCallback) {
  if (typeof window !== 'undefined') {
    return sessionSync.subscribe(callback)
  }
  return () => {}
}

export function forceSessionSync() {
  sessionSync.forceSync()
}

export function broadcastSessionEvent(event: 'signin' | 'signout') {
  sessionSync.broadcastSessionEvent(event)
}