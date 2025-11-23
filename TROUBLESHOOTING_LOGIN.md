# Troubleshooting: Login Not Working on Vercel

## Quick Checklist

### 1. Verify Domain is Added Correctly

**Check in Firebase Console:**
1. Go to https://console.firebase.google.com
2. Select project: **pawsera-5c5d5**
3. Go to **Authentication** → **Settings** tab
4. Scroll to **Authorized domains**
5. Verify `pawsera-dicasq7w1-raginis19s-projects.vercel.app` is in the list
6. Make sure there are NO typos

**Common mistakes:**
- ❌ `https://pawsera-dicasq7w1-raginis19s-projects.vercel.app` (has https://)
- ❌ `pawsera-dicasq7w1-raginis19s-projects.vercel.app/` (has trailing slash)
- ✅ `pawsera-dicasq7w1-raginis19s-projects.vercel.app` (correct)

### 2. Check What Error You're Seeing

**Open browser console (F12) and check for errors:**

**Error: "auth/unauthorized-domain"**
- Domain not added correctly
- Solution: Re-add the domain in Firebase Console

**Error: "auth/operation-not-allowed"**
- Email/Password not enabled
- Solution: Enable Email/Password in Firebase Console (Step 2)

**Error: "permission-denied" or "insufficient permissions"**
- Firestore security rules blocking access
- Solution: Update Firestore Security Rules (Step 3)

**Error: "auth/invalid-credential" or "auth/user-not-found"**
- Wrong email/password
- Solution: Try creating a new account

**No error but nothing happens:**
- Check Network tab in browser console
- Look for failed requests to Firebase

### 3. Test the Exact URL

**Make sure you're testing from:**
- `https://pawsera-dicasq7w1-raginis19s-projects.vercel.app`
- NOT from `localhost:3000`
- NOT from a different Vercel preview URL

### 4. Clear Browser Cache

**Try in incognito/private window:**
1. Open a new incognito/private browser window
2. Go to your Vercel URL
3. Try to sign up/login

**Or clear cache:**
- Chrome: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Select "Cached images and files"
- Clear data

### 5. Check Firebase Project Settings

**Verify you're using the correct Firebase project:**
1. Go to Firebase Console
2. Check Project ID: Should be **pawsera-5c5d5**
3. Go to **Project Settings** (gear icon)
4. Check **Your apps** section
5. Verify the config matches your code in `src/api/firebase.js`

### 6. Wait for Changes to Propagate

**Firebase changes can take 1-5 minutes:**
- After adding a domain, wait 2-3 minutes
- Try again after waiting
- Clear browser cache and try again

### 7. Check Firestore Security Rules

**If login works but you can't save data:**
1. Go to Firebase Console
2. Go to **Firestore Database** → **Rules**
3. Check if rules allow authenticated users
4. Update rules if needed (see Step 3 in FIREBASE_VERCEL_SETUP.md)

## Step-by-Step Debugging

### Step 1: Check Browser Console

1. Open your Vercel URL
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to sign up/login
5. **Copy any error messages** you see

### Step 2: Check Network Requests

1. In Developer Tools, go to **Network** tab
2. Try to sign up/login
3. Look for requests to Firebase (they'll have `firebase` in the URL)
4. Check if any requests are failing (red status)
5. Click on failed requests to see error details

### Step 3: Verify Domain Format

**Your domain should be exactly:**
```
pawsera-dicasq7w1-raginis19s-projects.vercel.app
```

**Check for:**
- No `https://` prefix
- No `http://` prefix
- No trailing `/`
- No spaces
- All lowercase

### Step 4: Test with a New Account

1. Try creating a **brand new account** with a different email
2. Use a simple email like `test123@example.com`
3. Use a simple password (at least 6 characters)
4. See if account creation works

### Step 5: Check Firebase Authentication Users

1. Go to Firebase Console
2. Go to **Authentication** → **Users** tab
3. Check if new users are being created
4. If users appear here but login doesn't work, it's a Firestore rules issue

## Common Issues and Solutions

### Issue: "This domain is not authorized"
**Solution:**
- Double-check domain spelling in Firebase Console
- Make sure domain matches exactly (case-sensitive)
- Wait 2-3 minutes after adding domain
- Try clearing browser cache

### Issue: Login works but can't see/save data
**Solution:**
- Update Firestore Security Rules (Step 3)
- Check browser console for permission errors
- Verify user is authenticated (check Firebase Console → Authentication → Users)

### Issue: "Email/password authentication is not enabled"
**Solution:**
- Go to Firebase Console → Authentication → Sign-in method
- Enable Email/Password
- Make sure "Enable" toggle is ON

### Issue: Works on localhost but not on Vercel
**Solution:**
- Make sure Vercel domain is added to Firebase Authorized Domains
- Check that you're testing from the correct Vercel URL
- Verify Firebase config in code matches Firebase project

## Need More Help?

**Please provide:**
1. Exact error message from browser console
2. Screenshot of Firebase Authorized Domains list
3. What happens when you try to sign up/login (does it show an error? does nothing happen?)
4. Browser and device you're testing on

## Quick Test

**Try this test:**
1. Open incognito window
2. Go to: `https://pawsera-dicasq7w1-raginis19s-projects.vercel.app`
3. Open browser console (F12)
4. Try to create account with email: `test@test.com` and password: `test123`
5. **Copy and share any error messages** you see in the console

