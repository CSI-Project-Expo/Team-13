# Google OAuth Setup Guide

This guide will help you configure Google OAuth for your Do4U application.

## Prerequisites
- A Supabase project (you should already have this)
- A Google Cloud Console account

## Step 1: Configure Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - If you don't have a project, click "Select a project" → "New Project"
   - Give it a name (e.g., "Do4U Auth") and click "Create"

3. **Enable Google+ API** (if not already enabled)
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" user type (unless you have Google Workspace)
   - Click "Create"
   - Fill in the required fields:
     - **App name**: Do4U
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click "Save and Continue"
   - Skip the "Scopes" section (click "Save and Continue")
   - Add test users if needed (during development)
   - Click "Save and Continue", then "Back to Dashboard"

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Do4U Web Client"
   - **Authorized JavaScript origins**: Add your frontend URL
     - For local development: `http://localhost:5173`
     - For production: Your production domain
   - **Authorized redirect URIs**: Add your Supabase callback URL
     - Format: `https://gexgiidqmymyuaezltep.supabase.co/auth/v1/callback`
     - You can find your Supabase URL in your Supabase project settings
   - Click "Create"
   - **Important**: Copy the **Client ID** and **Client Secret** - you'll need these next

## Step 2: Configure Supabase

1. **Go to Your Supabase Dashboard**
   - Visit [Supabase Dashboard](https://app.supabase.com/)
   - Select your project

2. **Enable Google Provider**
   - Go to "Authentication" → "Providers"
   - Find "Google" in the list
   - Toggle it to **Enabled**

3. **Add Google Credentials**
   - Paste the **Client ID** from Google Cloud Console
   - Paste the **Client Secret** from Google Cloud Console
   - Click "Save"

4. **Verify Redirect URL**
   - Make sure the redirect URL shown in Supabase matches what you entered in Google Cloud Console
   - It should be: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

## Step 3: Update Environment Variables (if needed)

Your `.env` file in the frontend should already have:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Make sure these are correct. You can find them in:
- Supabase Dashboard → Project Settings → API

## Step 4: Test Google Login

1. **Start your application**
   ```bash
   # In frontend directory
   npm run dev
   ```

2. **Test the flow**
   - Navigate to the login page
   - Click "Continue with Google"
   - You should be redirected to Google's login page
   - After signing in, you should be redirected back to your app
   - The app will automatically create a user profile in your database

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches your Supabase callback URL
- Check that there are no trailing slashes or typos

### Error: "Access blocked: This app's request is invalid"
- Make sure you've configured the OAuth consent screen
- Add yourself as a test user if the app is still in development mode

### User is created in Supabase Auth but not in your database
- Check your backend logs for errors
- The `/api/v1/users/me` endpoint should auto-create the user profile
- Make sure the user's metadata contains the `name` and `role` fields

### Google login isn't triggering
- Check browser console for errors
- Make sure your Supabase URL and anon key are correct in `.env`
- Verify that Google provider is enabled in Supabase dashboard

## Production Deployment

When deploying to production:

1. **Update Google Cloud Console**
   - Add your production domain to "Authorized JavaScript origins"
   - Example: `https://yourdomain.com`

2. **Update Supabase redirect URL (if using custom domain)**
   - If you're using a custom domain with Supabase, update the callback URL in Google Cloud Console

3. **Publish OAuth Consent Screen**
   - In Google Cloud Console, go to OAuth consent screen
   - Click "Publish App" to make it available to all users
   - Note: This may require verification by Google if you request sensitive scopes

## Security Notes

- Never commit your Google Client Secret to version control
- Store sensitive credentials in environment variables only
- The Supabase anon key is safe to expose in frontend code (it's designed for this)
- Always use HTTPS in production

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
