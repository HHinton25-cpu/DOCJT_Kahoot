# DOCJT Live Kahoot — Fixed Auto-Advance + Refined Question Set

This is the same DOCJT live Kahoot-style site you already tested successfully. It does **not** include the public quiz-creator feature.

## What changed in this version

- Fixed early skipping: each question now locks in the eligible player list when the question starts.
- The host auto-reveals only when those locked-in players have answered, or when the timer reaches 0.
- If a phone briefly disconnects, the player count will not shrink and accidentally skip the question.
- Added a second selectable question bank: **Refined Questions**.
- Added `refined_questions.js`, generated from your uploaded CSV.
- Kept the custom background music at `audio/quiz-click-sprint.mp3`.

## Upload instructions

Upload all unzipped files to your GitHub Pages repository, replacing the old files.

Important files:

- `index.html`
- `host.html`
- `play.html`
- `common.js`
- `host.js`
- `play.js`
- `styles.css`
- `firebase-config.js`
- `firebase-rules.json`
- `questions.js`
- `refined_questions.js`
- `audio/quiz-click-sprint.mp3`

## Firebase

You do **not** need to change your Firebase rules for this version if your previous DOCJT live Kahoot site was already working.

## How to use

Host page:

`host.html`

Player page:

`play.html`

On the host setup screen, choose either:

- Original DOCJT Questions
- Refined Questions

Then choose category, number of questions, timer, and create the game PIN.
