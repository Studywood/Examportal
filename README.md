# Examportal

A GitHub-hosted mock-test platform with Firebase backend.

## Included

- Class selection
- Student sign-up/login
- Optional Google login
- Remember-me persistence
- Student dashboard
- Admin dashboard
- Test creation/edit/delete
- Publish/unpublish
- Admin-controlled test duration
- Multiple-choice questions
- LaTeX/MathJax rendering
- Question images
- Timed exam screen
- Question palette
- Instant score/result
- Cross-device online data through Firestore
- Firebase Storage rules for question images

## Important security note

The requested admin password `Abhi@2003` should NOT be written into HTML/JavaScript. Anything in a GitHub-hosted frontend can be inspected.

Instead, create the admin account in Firebase Authentication:

Email:
`abhi.admin@examportal.app`

Display name:
`Abhi Sir`

Password:
`Abhi@2003`

The app and Firestore rules identify this email as the admin.

For stronger production security, use a Firebase custom claim for the admin role instead of an email allowlist.

## Firebase setup

1. Create a Firebase project.
2. Enable Authentication:
   - Email/Password
   - Google
3. Create a Web App.
4. Copy its Firebase config into `firebase-config.js`.
5. Create Firestore Database.
6. Create Storage.
7. Paste `firestore.rules` into Firestore Rules.
8. Paste `storage.rules` into Storage Rules.
9. Create the admin account described above.
10. Host this folder using GitHub Pages.

## GitHub Pages

Upload all files to a repository. In GitHub:
Settings → Pages → Deploy from branch → main → /root.

The site is static; Firebase supplies the online database/authentication/storage.

## Adding image questions

The current editor accepts image URLs. For a production version, add a Firebase Storage upload button that uploads JPG/PNG/WebP files and automatically inserts the resulting Storage URL.

## Changing subjects/classes

The class list is in `app.js` inside `classCards()` and the editor's class array. Tests themselves are stored online, so adding/editing/deleting tests from the Admin Panel updates every device after refresh.

## Next upgrades

- Firebase Storage upload UI directly inside the question editor
- Separate subject/chapter management
- Student result history
- Detailed solutions
- Rank/leaderboard
- Test series
- Question randomization
- Negative marking presets
- Admin analytics
- Mobile PWA / install-to-phone support
- Secure custom admin claims
