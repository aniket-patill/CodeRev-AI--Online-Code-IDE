# Firebase Realtime Database Rules Setup

## Important: Deploy Database Rules

The voice chat feature requires specific Firebase Realtime Database security rules to work properly. 

### Option 1: Deploy via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Realtime Database** → **Rules** tab
4. Copy the contents from `database.rules.json` in this project
5. Paste into the rules editor
6. Click **Publish**

### Option 2: Deploy via Firebase CLI

If you have Firebase CLI installed:

```bash
firebase deploy --only database
```

Make sure you have a `firebase.json` file configured with:
```json
{
  "database": {
    "rules": "database.rules.json"
  }
}
```

### What These Rules Do

- **Participants**: Allow workspace members to read/write their own voice status
- **Signaling**: Allow workspace members to exchange WebRTC signaling messages (offers, answers, ICE candidates) with each other

The rules ensure that only authenticated users who are members of a workspace can access voice chat features for that workspace.

