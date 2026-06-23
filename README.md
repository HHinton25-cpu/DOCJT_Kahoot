# DOCJT Live Quiz

## Your Firebase config has been inserted

This package is configured for Firebase project `docjt-kahoot` using the config you provided, including `measurementId`.

I also added the required Realtime Database URL:

```js
databaseURL: "https://docjt-kahoot-default-rtdb.firebaseio.com"
```

If Firebase Console shows a different Realtime Database URL, open `firebase-config.js` and replace only the `databaseURL` line.


This is a Kahoot-style live multiplayer version of the DOCJT Academy quiz.

Players can join from their own phones with a 6-digit game PIN. The host screen controls the game, shows the questions, reveals the correct answer, and displays the leaderboard.

## What is included

- `index.html` — landing page
- `host.html` — teacher / host screen
- `play.html` — player phone screen
- `styles.css` — Kahoot-style layout and answer tiles
- `common.js` — shared question-bank and utility code
- `host.js` — live host logic
- `play.js` — live player logic
- `firebase-config.js` — paste your Firebase web app config here
- `firebase-rules.json` — Realtime Database security rules

## Why Firebase is required

A real Kahoot-style join-code game needs a shared live backend. GitHub Pages can host the website, but it cannot sync phones by itself. Firebase Realtime Database handles:

- game PIN rooms
- player joins
- live answer submissions
- countdown state
- scoring
- leaderboard updates

## Firebase setup

1. Go to Firebase Console and create a project.
2. Add a **Web App** to the project.
3. Copy the `firebaseConfig` object.
4. Open `firebase-config.js` and replace the placeholder values.
5. In Firebase, go to **Authentication > Sign-in method** and enable **Anonymous** sign-in.
6. Go to **Realtime Database** and create a database.
7. In the database **Rules** tab, paste the contents of `firebase-rules.json` and publish.
8. Upload this folder to GitHub Pages, Netlify, Firebase Hosting, or another static host.

## How to run

1. Open `host.html` on the teacher / projector device.
2. Click **Create Game PIN**.
3. Students scan the QR code or open `play.html` and enter the PIN.
4. Click **Start Game**.
5. Students answer on their phones.
6. The host reveals answers and moves through the quiz.

## Question bank

The site loads questions from:

1. A local `questions.js` file, if you place one beside these files.
2. The live DOCJT GitHub Pages `questions.js` file.
3. The GitHub raw source as a backup.

That means this package does not need to duplicate the question bank inside the zip.

## Deployment notes

- Firebase config values are safe to include in a public static site; Firebase security is controlled by rules, not by hiding the config.
- Do not use open public database rules like `.read: true, .write: true`.
- Keep the host tab open while the game is running. The current host browser holds the selected randomized question order and computes scoring.
- If the host refreshes in the middle of a game, create a new game PIN.

## Files to edit

Usually you only need to edit:

```js
// firebase-config.js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```