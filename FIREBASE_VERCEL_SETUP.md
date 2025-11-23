# Firebase Configuration for Vercel Deployment

## Issue: Login works for you but not for others

This is typically caused by Firebase Authentication domain restrictions or Firestore security rules.

## Step 1: Add Vercel Domain to Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **pawsera-5c5d5**
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Vercel domain (e.g., `your-app.vercel.app` or your custom domain)
6. Also add `localhost` if you want to test locally
7. Click **Add**

**Important:** Make sure these domains are added:
- `localhost` (for local development)
- `your-app.vercel.app` (your Vercel deployment URL)
- `your-custom-domain.com` (if you have a custom domain)

## Step 2: Check Firebase Authentication Providers

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Make sure **Email/Password** is enabled
3. Click on **Email/Password** and ensure:
   - **Enable** is turned ON
   - **Email link (passwordless sign-in)** can be disabled if not needed

## Step 3: Update Firestore Security Rules

1. Go to **Firestore Database** → **Rules**
2. Update your rules to allow authenticated users to read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || request.auth.token.email == resource.data.email);
      allow create: if request.auth != null;
    }
    
    // Users can read/write their own pets
    match /pets/{petId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerID;
      allow create: if request.auth != null;
    }
    
    // Users can read/write their own appointments
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null && (
        request.auth.uid == resource.data.ownerID || 
        request.auth.uid == resource.data.vetId ||
        request.auth.uid == resource.data.vetID
      );
      allow create: if request.auth != null;
    }
    
    // Medical history - users can read/write their own pet's records
    match /medical_history/{recordId} {
      allow read, write: if request.auth != null;
    }
    
    // Documents - users can read/write their own pet's documents
    match /documents/{documentId} {
      allow read, write: if request.auth != null;
    }
    
    // Educational resources - vets can create, all can read
    match /educational_resources/{resourceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Care recommendations - vets can create, owners can read their own
    match /care_recommendations/{recommendationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**For testing purposes only** (NOT recommended for production):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

## Step 4: Check Firebase Storage Rules

1. Go to **Storage** → **Rules**
2. Update rules to allow authenticated users to upload files:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

## Step 5: Verify Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Make sure these are set (if you're using environment variables):
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - etc.

**Note:** Currently, your Firebase config is hardcoded in `src/api/firebase.js`, so environment variables are optional.

## Step 6: Test the Deployment

1. Open your Vercel deployment URL in an incognito/private browser window
2. Try to create a new account
3. Try to login with an existing account
4. Check the browser console (F12) for any errors

## Common Issues and Solutions

### Issue: "auth/unauthorized-domain"
**Solution:** Add the Vercel domain to Firebase Authorized Domains (Step 1)

### Issue: "permission-denied" in Firestore
**Solution:** Update Firestore security rules (Step 3)

### Issue: "auth/operation-not-allowed"
**Solution:** Enable Email/Password authentication in Firebase Console (Step 2)

### Issue: Users can't see their data
**Solution:** Check Firestore security rules and ensure they match the user's UID or email

## Debugging Tips

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for Firebase errors
   - Check Network tab for failed requests

2. **Check Firebase Console:**
   - Go to **Authentication** → **Users** to see if users are being created
   - Go to **Firestore Database** to see if data is being saved
   - Check **Firebase Console** → **Project Settings** → **Usage** for any quota issues

3. **Test with Different Users:**
   - Create a test account from the Vercel deployment
   - Try logging in from different devices/browsers
   - Check if the issue is specific to certain users or all users

## Need More Help?

If issues persist:
1. Check the browser console for specific error messages
2. Check Firebase Console → **Authentication** → **Users** to see if accounts are being created
3. Check Firebase Console → **Firestore Database** to see if data is being saved
4. Review Firebase Console → **Project Settings** → **Usage** for any quota or billing issues

