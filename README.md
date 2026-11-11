# NeuKin Film Club

A one-page voting app for the NeuKin Film Club (August 2026). Archived: read-only, but still live.

- `index.html`: the app, served at https://junglepublics.github.io/neukin-film-club/
- `neukin-apps-script.gs`: the backend, a Google Apps Script web app that stores votes in a Google Sheet ("data" tab). It runs as the owner with access "Anyone", so voters don't sign in. Setup steps are in the comment at the top of the file.

Editing the script does not change the live URL: make a new deployment version in Apps Script.
