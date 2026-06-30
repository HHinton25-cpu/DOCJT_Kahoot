# DOCJT Live Kahoot - 3 Question Banks

This version keeps the same host/player DOCJT Kahoot-style site and adds a third selectable question bank.

## Question bank options

On `host.html`, use the **Question set** dropdown to choose:

1. Original DOCJT Questions (`questions.js`)
2. Refined Questions (`refined_questions.js`)
3. Legal Scenarios (`legal_scenarios_questions.js`)

## Early-skip fix

The host now reads a fresh Firebase snapshot right before each question starts, then locks the eligible player roster for that exact question. Auto-reveal only happens when every locked-in player has submitted an answer for that exact question, or when the timer reaches zero.

This prevents early skips caused by a stale host snapshot or a player briefly appearing offline.

## Upload instructions

1. Unzip this package.
2. Upload every file and folder inside it to your existing GitHub Pages repo.
3. Replace the older files.
4. Make sure these files are uploaded together:
   - `questions.js`
   - `refined_questions.js`
   - `legal_scenarios_questions.js`
   - `common.js`
   - `host.js`
   - `play.js`
   - `host.html`
   - `play.html`
   - `firebase-config.js`
   - `styles.css`
   - `audio/quiz-click-sprint.mp3`

## Firebase

No Firebase rule change is needed for this update if the previous DOCJT live Kahoot version was already working.

## Use

Host screen:

`host.html`

Player screen:

`play.html`
