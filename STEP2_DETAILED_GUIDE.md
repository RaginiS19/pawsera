# Step 2: Enable Email/Password Authentication - Detailed Guide

## Quick Steps

1. **Go to Firebase Console**
   - URL: https://console.firebase.google.com
   - Sign in with your Google account

2. **Select Your Project**
   - Click on **pawsera-5c5d5** from the project list

3. **Open Authentication**
   - Look for **Authentication** in the left sidebar menu
   - Click on it

4. **Go to Sign-in Method Tab**
   - At the top of the Authentication page, you'll see tabs
   - Click on **Sign-in method** tab

5. **Enable Email/Password**
   - In the list of providers, find **Email/Password**
   - Click on the **Email/Password** row (or the pencil/edit icon)
   - A dialog/popup will open

6. **Turn On Email/Password**
   - Toggle the **Enable** switch to **ON** (it should turn blue/green)
   - **Email link (passwordless sign-in)** can be left OFF (unless you need it)
   - Click **Save** button at the bottom

7. **Verify**
   - You should see **Email/Password** with a green checkmark or "Enabled" status
   - The status should show as "Enabled"

## What You Should See

### Before Enabling:
- Email/Password shows as "Disabled" or has a gray status
- No checkmark next to it

### After Enabling:
- Email/Password shows as "Enabled" 
- Green checkmark or enabled indicator
- Status shows "Enabled"

## Troubleshooting

### Issue: Can't find Authentication in sidebar
**Solution:**
- Make sure you're signed in to the correct Google account
- Check if you have access to the project
- Try refreshing the page

### Issue: Email/Password option is grayed out
**Solution:**
- Make sure you have the correct permissions (Owner or Editor role)
- Try refreshing the page
- Check if there are any billing issues (though Email/Password is free)

### Issue: Changes won't save
**Solution:**
- Make sure you clicked "Save" button
- Check your internet connection
- Try refreshing and doing it again

### Issue: Still can't enable it
**Solution:**
- Make sure you're the project owner or have Editor permissions
- Check Firebase Console → Project Settings → Users and permissions
- Contact project owner if you don't have permissions

## Verification Checklist

After completing Step 2, verify:
- [ ] Email/Password is listed in Sign-in method
- [ ] Status shows "Enabled"
- [ ] Green checkmark or enabled indicator is visible
- [ ] You can click on it and see "Enable" toggle is ON

## Next Steps

Once Step 2 is complete:
1. ✅ Step 1: Add Vercel domain to Authorized Domains (if not done)
2. ✅ Step 2: Enable Email/Password (YOU ARE HERE)
3. ⏭️ Step 3: Update Firestore Security Rules
4. ⏭️ Step 4: Update Firebase Storage Rules
5. ⏭️ Step 5: Test the deployment

## Need Help?

If you're still having issues:
1. Take a screenshot of what you see
2. Check the browser console for any errors (F12)
3. Make sure you're using the correct Google account
4. Verify you have access to the Firebase project

