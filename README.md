# DOCJT Live Kahoot

This package is ready for GitHub Pages and includes your `questions.js` file.

## Upload steps

1. Unzip this folder.
2. Open the folder.
3. Upload the files inside this folder to your GitHub repo, not the ZIP itself.
4. Make sure `questions.js` is in the same folder as `host.html`, `play.html`, `common.js`, `host.js`, and `play.js`.
5. In Firebase, make sure Anonymous Authentication is enabled.
6. In Firebase Realtime Database > Rules, paste the contents of `firebase-rules.json` and click Publish.

## Pages

- Host screen: `host.html`
- Player join screen: `play.html`
- Home page: `index.html`

## Test

After uploading, open:

- `https://hhinton25-cpu.github.io/DOCJT_EXAM/questions.js`

If you can see the question file there, open:

- `https://hhinton25-cpu.github.io/DOCJT_EXAM/host.html`

Create a PIN on the host screen, then open `play.html` in another tab or on a phone and join with the PIN.
