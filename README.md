# DOCJT Live Kahoot

This is the Firebase live-join version of the DOCJT quiz game.

## What changed in this version

- Built-in game music using the browser audio engine. No MP3 files are needed.
- Countdown beeps during the final 5 seconds.
- Answer-sent sound on player phones.
- Points count-up animation and points-tally sound effects.
- Victory music at the end of the game.
- The host now automatically moves to the answer/explanation screen once every currently online player has answered.
- The player reveal screen also shows the explanation.

## Upload instructions

Upload every file in this folder to the same GitHub Pages repo/folder:

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

Do not upload only the ZIP file. Unzip first, then upload the contents.

## Firebase

If the previous version already worked, you do not need to change Firebase again for this audio/auto-advance update.

Keep these enabled:

1. Authentication → Anonymous sign-in: enabled
2. Realtime Database: created
3. Realtime Database rules: published

## Use

Host:

`host.html`

Players:

`play.html`

The browser may require one click before audio starts. Creating/joining/starting the game counts as that click.


## Custom background audio

This package includes your uploaded track at `audio/quiz-click-sprint.mp3`. The host and player pages use it as the looping lobby/question background music after the first user click unlocks browser audio. The built-in generated music remains as a fallback if the MP3 cannot load.
