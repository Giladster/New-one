# Put Tiny Planet online (free)

The game is one small Node server (`server/server.js`). It serves the game page and keeps the
shared galaxy: planets, players, chat and notes. Players connect to it with a WebSocket.

## 1. Render (the game server)

1. In Render, click **New → Web Service**.
2. Pick **GitHub** and choose the repository **Giladster/New-one**.
3. Fill in:
   - **Branch:** `claude/multiplayer-space-game-ji0lkn` (or `main` once this is merged)
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Click **Create Web Service**. After a few minutes Render shows a link like
   `https://tiny-planets.onrender.com`. Open it, pick your names, and you are in the live galaxy.
   Send the same link to friends.

(Or use **New → Blueprint** and pick the repo: `render.yaml` fills these in for you.)

**Free plan notes**
- The server falls asleep after about 15 minutes with nobody playing. The next visitor waits
  about a minute while it wakes up.
- Without a database, the galaxy is lost every time the server sleeps or restarts. Step 2 fixes this.

## 2. Database (keeps the world alive)

Any Postgres database works. Free choice: **Neon** (neon.tech), which does not expire.

1. Create a free Neon project and copy its **connection string** (starts with `postgresql://`).
2. In Render, open the web service → **Environment** → add `DATABASE_URL` = that string → **Save**.
3. Render restarts the server. The status page `/status` now says `"storage":"postgres"`.

From then on, a destroyed planet stays destroyed for everyone, notes wait for their owner,
and the galaxy survives the server sleeping.

## Run it on your own computer

```
npm install
npm start
```
Then open http://localhost:3000 in two browser windows to play against yourself.

## Optional: "server is waking up" screen

The free server sleeps after 15 minutes. While it sleeps, Render shows its own page, not the game.
To show our own wake-up bar, host the game page on a free **Static Site** (it never sleeps):

1. Render → New → Static Site → pick this repo.
2. Build command: leave empty. Publish directory: `game`.
3. Open the static site's link. It wakes the game server and shows a progress bar (about 1 minute).

The game server address is set in `game/index.html` (`GAME_SERVER`).
