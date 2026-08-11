# Ali Store — Render deployment

## 1) GitHub
Create a repository and upload all files from this folder.

## 2) Render
Create a Web Service from the GitHub repository, or use the included `render.yaml` Blueprint.

Build command:
npm install

Start command:
npm start

## 3) Environment variables
Set:
ADMIN_EMAIL = your admin email
ADMIN_PASSWORD = a strong new password
JWT_SECRET = a long random secret (Render can generate it)

## 4) Storage
The included Blueprint creates a 10 GB persistent disk mounted at `/opt/render/project/src`.
This keeps the SQLite database and uploaded APK/icon files on the persistent disk.

## 5) Important production security
- Change the default admin credentials immediately.
- Use HTTPS.
- Only upload APK files from trusted sources.
- Add malware/virus scanning before public distribution.
- Back up the database and APK storage.
- Add rate limiting and moderation before opening public registration/uploads.

## 6) After deploy
Open the Render URL, click Admin, log in, upload an APK, add app details/icon/screenshots, and Publish.
