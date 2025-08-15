# Google OAuth Profile Creation Fix

This document explains the fixes implemented to resolve issues with Google OAuth users not getting profiles created and the "My Profile" page showing blank screens.

## Issues Resolved

### 1. Google OAuth Users Missing Profiles
**Problem**: Users signing up via Google OAuth were not getting profiles created in the `profiles` table, only in the authentication section.

**Root Cause**: Missing OAuth callback route to handle the authentication flow and profile creation.

**Solution**: 
- Created `/app/auth/callback/route.ts` to handle OAuth callbacks
- Implemented profile creation logic for OAuth users
- Added fallback profile creation in the auth context

### 2. Blank "My Profile" Page
**Problem**: Users without profiles would see a blank screen when accessing the profile page.

**Root Cause**: The profile page returned `null` when no profile was found, causing a blank render.

**Solution**:
- Updated profile page to show a helpful message when no profile exists
- Added "Create Profile" and "Refresh Page" buttons
- Implemented manual profile creation functionality

## Files Created/Modified

### New Files
1. **`/app/auth/callback/route.ts`** - OAuth callback handler
2. **`/lib/profile-utils.ts`** - Profile creation utilities
3. **`/scripts/fix-existing-oauth-users.sql`** - SQL script to fix existing users
4. **`/scripts/fix-google-oauth-setup.sql`** - Database setup script (already existed)

### Modified Files
1. **`/contexts/auth-context.tsx`** - Enhanced profile loading with fallback creation
2. **`/app/profile/page.tsx`** - Added profile creation UI and error handling

## How It Works

### OAuth Flow
1. User clicks "Sign up with Google"
2. Redirected to Google OAuth
3. Google redirects back to `/auth/callback` with authorization code
4. Callback route exchanges code for session
5. Checks if profile exists, creates one if missing
6. Redirects user to intended destination

### Profile Creation Logic
1. Extracts user data from OAuth metadata:
   - `first_name` from `user_metadata.first_name`
   - `last_name` from `user_metadata.last_name` 
   - Falls back to parsing `full_name` or using email prefix
2. Creates profile record in `profiles` table
3. Links profile to user via `id` field

### Fallback Mechanisms
1. **Auth Context**: Automatically attempts profile creation when user loads but no profile exists
2. **Profile Page**: Shows manual "Create Profile" button if automatic creation fails
3. **Database Trigger**: `handle_new_user()` function should create profiles for new users

## Testing the Fix

### For New Users
1. Go to signup page
2. Click "Sign up with Google"
3. Complete Google OAuth flow
4. Should be redirected back with profile created
5. Visit "/profile" page to verify profile exists

### For Existing Users Without Profiles
1. Sign in with existing Google account
2. Visit "/profile" page
3. Should see "Profile Not Found" message with "Create Profile" button
4. Click "Create Profile" to manually create profile
5. Profile should be created and page should refresh

## Database Scripts

### Fix Existing Users
Run `/scripts/fix-existing-oauth-users.sql` in Supabase SQL Editor to:
- Identify users without profiles
- Create profiles for existing OAuth users
- Verify the fix worked

### Setup Database
Run `/scripts/fix-google-oauth-setup.sql` to ensure:
- `profiles` table exists with correct structure
- RLS policies are properly configured
- `handle_new_user()` trigger function exists

## Environment Variables Required

Ensure these are set in your environment:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Profile Still Not Created
1. Check browser console for errors
2. Verify Supabase environment variables
3. Check RLS policies allow profile creation
4. Run database diagnostic script
5. Try manual profile creation from profile page

### OAuth Redirect Issues
1. Verify OAuth callback URL is configured in Google Console: `your-domain.com/auth/callback`
2. Check Supabase Auth settings for correct redirect URLs
3. Ensure no middleware is blocking the callback route

### Database Permission Issues
1. Verify RLS policies on `profiles` table
2. Check if `authenticated` role has INSERT permissions
3. Ensure `handle_new_user()` function has proper permissions

## Security Considerations

1. **RLS Policies**: Profiles can only be created/viewed by the user who owns them
2. **Input Validation**: User metadata is sanitized before profile creation
3. **Error Handling**: Sensitive errors are logged server-side, generic messages shown to users
4. **Fallback Safety**: Multiple fallback mechanisms prevent users from being stuck without profiles

## Future Improvements

1. **Enhanced Metadata**: Capture more user information from OAuth providers
2. **Profile Completion**: Guide users to complete missing profile information
3. **Bulk Migration**: Tool to migrate existing users in batches
4. **Monitoring**: Add logging/metrics for profile creation success rates