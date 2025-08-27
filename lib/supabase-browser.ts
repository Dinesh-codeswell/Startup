import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Enhanced session persistence settings
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Storage configuration for better cross-tab sync
      storage: {
        getItem: (key: string) => {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key)
          }
          return null
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value)
            // Broadcast storage change to other tabs
            window.dispatchEvent(new StorageEvent('storage', {
              key,
              newValue: value,
              storageArea: window.localStorage
            }))
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key)
            // Broadcast storage change to other tabs
            window.dispatchEvent(new StorageEvent('storage', {
              key,
              newValue: null,
              storageArea: window.localStorage
            }))
          }
        }
      }
    },
    // Global configuration
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  })
}