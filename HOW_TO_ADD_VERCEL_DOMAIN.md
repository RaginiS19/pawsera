# How to Add Vercel Domain to Firebase Authorized Domains

## Quick Steps

### Part 1: Get Your Vercel Domain

1. **Go to Vercel Dashboard**
   - Open: https://vercel.com/dashboard
   - Sign in with your account

2. **Find Your Project**
   - Look for your "Pawsera" project in the list
   - Click on it

3. **Copy Your Domain**
   - You'll see your deployment URL at the top
   - It will look like: `pawsera-xxxxx.vercel.app` or `your-custom-domain.com`
   - **Copy this entire URL** (without `https://`)

### Part 2: Add Domain to Firebase

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com
   - Sign in with your Google account

2. **Select Your Project**
   - Click on **pawsera-5c5d5** from the project list

3. **Navigate to Authentication**
   - In the left sidebar, click **Authentication**
   - If you don't see it, click the menu icon (☰) at the top left

4. **Go to Settings Tab**
   - At the top, you'll see tabs: **Users**, **Sign-in method**, **Settings**
   - Click on **Settings** tab

5. **Find Authorized Domains Section**
   - Scroll down to find **Authorized domains** section
   - You'll see a list of domains like:
     - `localhost`
     - `pawsera-5c5d5.firebaseapp.com`
     - `pawsera-5c5d5.web.app`

6. **Add Your Vercel Domain**
   - Click the **Add domain** button
   - A text input field will appear
   - **Paste your Vercel domain** (the one you copied in Part 1)
   - Example: `pawsera-xxxxx.vercel.app`
   - **Important:** Don't include `https://` or `http://`
   - Just the domain name: `pawsera-xxxxx.vercel.app`

7. **Save**
   - Click **Add** button
   - Your domain should now appear in the list

## Visual Guide

```
Firebase Console
├── Project: pawsera-5c5d5
└── Authentication (left sidebar)
    └── Settings (tab)
        └── Authorized domains (section)
            ├── localhost ✅
            ├── pawsera-5c5d5.firebaseapp.com ✅
            ├── pawsera-5c5d5.web.app ✅
            └── [Add domain] button ← Click here
                └── Enter: your-app.vercel.app
                    └── [Add] button
```

## What Your Vercel Domain Looks Like

Your Vercel domain will be one of these formats:
- `pawsera-xxxxx.vercel.app` (default Vercel domain)
- `pawsera-git-main-xxxxx.vercel.app` (preview deployment)
- `your-custom-domain.com` (if you added a custom domain)

**You need to add the main production domain** (the one that shows when you visit your app).

## Verification

After adding the domain:
- ✅ It should appear in the Authorized domains list
- ✅ No error messages
- ✅ You can see it in the list immediately

## Troubleshooting

### Issue: Can't find "Settings" tab
**Solution:**
- Make sure you're in the **Authentication** section
- Look for tabs at the top: Users, Sign-in method, Settings
- Settings is usually the third tab

### Issue: "Add domain" button not visible
**Solution:**
- Scroll down in the Settings tab
- Look for "Authorized domains" section
- Make sure you have Editor or Owner permissions

### Issue: Domain already exists
**Solution:**
- That's fine! It means it's already added
- You can skip this step

### Issue: Invalid domain format
**Solution:**
- Make sure you're not including `https://` or `http://`
- Just use: `your-app.vercel.app`
- No trailing slashes: `/`

## Example

If your Vercel URL is: `https://pawsera-abc123.vercel.app`

**Add this to Firebase:** `pawsera-abc123.vercel.app`

(Without `https://` and without trailing `/`)

## Next Steps

After adding the domain:
1. ✅ Step 1: Add Vercel domain (YOU ARE HERE)
2. ✅ Step 2: Enable Email/Password (Already done)
3. ⏭️ Step 3: Update Firestore Security Rules
4. ⏭️ Step 4: Update Firebase Storage Rules
5. ⏭️ Step 5: Test the deployment

## Need Help?

If you're stuck:
1. Check that you're in the correct Firebase project
2. Make sure you have the correct Vercel domain
3. Try refreshing the Firebase Console page
4. Check that you have Editor or Owner permissions

