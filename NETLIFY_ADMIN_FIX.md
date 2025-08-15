# Netlify Admin Authentication Fix Guide

## 🚨 Issue Summary

The admin authentication is failing on Netlify because the `SUPABASE_SERVICE_ROLE_KEY` environment variable is missing. This key is required for admin functionality to work properly.

## 🔧 Required Fixes

### 1. Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. This key should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Update Local Environment

✅ **Already Done**: The `.env` file has been updated with a placeholder for the service role key.

Replace `YOUR_SERVICE_ROLE_KEY_HERE` in your `.env` file with your actual service role key:

```env
NEXT_PUBLIC_SUPABASE_URL="https://ehvqmrqxauvhnapfsamk.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodnFtcnF4YXV2aG5hcGZzYW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTA1NTMsImV4cCI6MjA2OTI2NjU1M30._vBLfJaNDe3luXCrrMIFLr9c81J5ImucM-shIlfGrSI"
SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key_here"
```

### 3. Configure Netlify Environment Variables

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add the following environment variables:

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ehvqmrqxauvhnapfsamk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodnFtcnF4YXV2aG5hcGZzYW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTA1NTMsImV4cCI6MjA2OTI2NjU1M30._vBLfJaNDe3luXCrrMIFLr9c81J5ImucM-shIlfGrSI` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_actual_service_role_key_here` |

### 4. Redeploy Your Site

After adding the environment variables:

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the deployment to complete

## 🔍 Verification Steps

### Test Admin Access

1. Visit your deployed site
2. Sign in with an authorized admin email:
   - `dineshkatal.work@gmail.com`
   - `katal091995@gmail.com`
3. Try to access admin routes:
   - `/admin/dashboard`
   - `/case-match`
   - `/rl-dashboard`

### Check for Errors

If you still encounter issues:

1. Check Netlify function logs:
   - Go to **Functions** tab in Netlify
   - Look for any error messages

2. Check browser console:
   - Open Developer Tools (F12)
   - Look for authentication errors

## 🚨 Security Notes

⚠️ **Important**: The service role key has elevated privileges. Never expose it in:
- Client-side code
- Public repositories
- Browser console logs
- Error messages shown to users

## 🔧 Troubleshooting

### Issue: "Admin access required" error
**Solution**: Ensure you're signed in with an authorized admin email and the service role key is properly set.

### Issue: "Supabase configuration missing" error
**Solution**: Verify all three environment variables are set in Netlify.

### Issue: "Invalid or expired token" error
**Solution**: 
1. Sign out and sign in again
2. Check if the service role key is correct
3. Verify the Supabase project URL matches your new project

### Issue: Still getting authentication errors
**Solution**:
1. Double-check the service role key is copied correctly (no extra spaces)
2. Ensure the key corresponds to the correct Supabase project
3. Verify the admin email is in the authorized list in `middleware.ts`

## 📝 Next Steps

After fixing the environment variables:

1. ✅ Test local admin functionality
2. ✅ Deploy to Netlify with proper environment variables
3. ✅ Verify admin access works on production
4. ✅ Test all admin features (dashboard, case matching, team formation)

## 🎯 Expected Result

Once properly configured:
- Admin users can access `/admin/dashboard`
- Case matching functionality works
- Team formation features are accessible
- No "Admin access required" errors for authorized users