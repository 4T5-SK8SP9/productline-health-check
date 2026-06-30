# Team Health Check — Setup & Deployment Guide

## What this is
A real-time anonymous team health scoring tool. Each member votes on their own device. Votes are hidden until everyone has voted, then revealed simultaneously. Lowest score per question is the final recorded score.

---

## Step 1 — Get your Firebase config

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open your existing project (or create a new one)
3. Go to **Project Settings → Your Apps**
4. If no web app exists, click **Add app → Web**
5. Copy the `firebaseConfig` object — you'll need all 7 values

### Enable Realtime Database
1. In Firebase Console → **Build → Realtime Database**
2. Click **Create database**
3. Choose your region (e.g. europe-west1 for EU)
4. Start in **test mode** (you can add rules later)

### Firebase Database Rules (paste in Rules tab)
```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

---

## Step 2 — Set up the GitHub repository

1. Create a new GitHub repo called `team-health-check`
2. Push all files from this folder to the `main` branch
3. Go to **Settings → Pages**
4. Set Source to **GitHub Actions**

### Add Firebase secrets
Go to **Settings → Secrets and variables → Actions → New repository secret**

Add each of these:

| Secret name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | your apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | your authDomain |
| `VITE_FIREBASE_DATABASE_URL` | your databaseURL |
| `VITE_FIREBASE_PROJECT_ID` | your projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | your storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your messagingSenderId |
| `VITE_FIREBASE_APP_ID` | your appId |

---

## Step 3 — Deploy

Push to `main` — GitHub Actions will build and deploy automatically.

Your app will be live at:
```
https://<your-github-username>.github.io/team-health-check/
```

---

## How to run a session

1. **Facilitator** opens the app → Create session → shares the 6-character code
2. **Team members** open the app on their own devices → Join session → enter code + name
3. Facilitator clicks **Start assessment**
4. Everyone sees the same question simultaneously
5. Each person votes 1–5 anonymously
6. When the last vote lands → all votes reveal automatically
7. Lowest score is shown → auto-advances to next question after 3 seconds
8. After all 24 questions → results screen with category breakdown and focus areas

---

## Local development

```bash
# Install dependencies
npm install

# Create .env.local with your Firebase values
cp .env.example .env.local
# Edit .env.local and fill in your Firebase config

# Run locally
npm run dev
```

---

## .env.local example

```
VITE_FIREBASE_API_KEY=your_value_here
VITE_FIREBASE_AUTH_DOMAIN=your_value_here
VITE_FIREBASE_DATABASE_URL=your_value_here
VITE_FIREBASE_PROJECT_ID=your_value_here
VITE_FIREBASE_STORAGE_BUCKET=your_value_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_value_here
VITE_FIREBASE_APP_ID=your_value_here
```
