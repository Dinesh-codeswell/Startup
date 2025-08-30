import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from './supabase'

/**
 * Create a profile for a user who doesn't have one
 * This is useful for users who signed up via OAuth but didn't get a profile created
 */
export async function createProfileForUser(user: User): Promise<Profile | null> {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (existingProfile) {
      return existingProfile
    }
    
    // Extract and parse the full name from OAuth metadata
    const fullNameFromOAuth = user.user_metadata?.full_name || 
                              user.user_metadata?.name || 
                              user.user_metadata?.display_name || '';
    
    let firstName = '';
    let lastName = '';
    
    if (fullNameFromOAuth && fullNameFromOAuth.trim() !== '') {
      // Split full name into first and last name
      const nameParts = fullNameFromOAuth.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    } else {
      // Fallback to individual first_name and last_name fields
      firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || '';
      lastName = user.user_metadata?.last_name || '';
    }
    
    // Ensure we have at least a first name
    if (!firstName || firstName.trim() === '') {
      firstName = user.email?.split('@')[0] || '';
    }
    
    const collegeName = user.user_metadata?.college_name || ''
    
    // Create new profile
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email || '',
        college_name: collegeName,
        full_access: user.user_metadata?.full_access ?? true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating profile:', error)
      return null
    }
    
    console.log('Profile created successfully for user:', user.email)
    return newProfile
    
  } catch (error) {
    console.error('Error in createProfileForUser:', error)
    return null
  }
}

/**
 * Ensure a user has a profile, creating one if necessary
 */
export async function ensureUserProfile(user: User): Promise<Profile | null> {
  try {
    // First try to get existing profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profile && !error) {
      return profile
    }
    
    // If no profile exists, create one
    if (error?.code === 'PGRST116') {
      return await createProfileForUser(user)
    }
    
    console.error('Error fetching profile:', error)
    return null
    
  } catch (error) {
    console.error('Error in ensureUserProfile:', error)
    return null
  }
}
