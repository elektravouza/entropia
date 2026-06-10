# ENTROPIA — 26 Years of Chaos 🍒

An interactive birthday invitation that behaves like a digital art piece.
Scrolling moves you through the day of the party: the WebGL sky starts at
17:00 daylight, melts into sunset, and ends in deep night at the RSVP.

**Event:** 18 July · Dragonera Beach Bar · 17:00 · Glam on the Beach

---

## What's in here

```
entropia/
├── index.html      ← the whole page structure & all the copy
├── css/style.css   ← the visual identity (colors, type, layout)
├── assets/
│   ├── face.png             ← YOUR face cutout (you upload this!)
│   └── face-fallback.svg    ← drawn stand-in shown until you do
└── js/
    ├── main.js     ← scroll choreography, RSVP, confetti, face rain
    ├── scene.js    ← the WebGL sky (Three.js shader)
    └── audio.js    ← procedural ocean sound (no audio files!)
```

### ⭐ Adding your face

The gate, the collage, the face marquee and the RSVP finale all use
`assets/face.png`. Until it exists, a hand-drawn fallback face shows.
To use your real photo:

1. Use your cutout photo (transparent background, PNG). Keep it under
   ~1500px tall so it loads fast.
2. On GitHub: open the `assets` folder → **Add file → Upload files** →
   drop your image → make sure it's named exactly **`face.png`** → Commit.

No build step. No npm. No node_modules. The libraries (Three.js, GSAP,
Lenis) load straight from a CDN. This is deliberate: it makes hosting
drag-and-drop simple.

---

## 1 · How to preview it on your computer

Browsers block some features when you open an HTML file directly, so you
need a tiny local server. Pick ONE of these:

**Option A — VS Code (easiest if you have it):**
1. Install the free **Live Server** extension (puzzle-piece icon → search "Live Server").
2. Right-click `index.html` → **"Open with Live Server"**. Done.

**Option B — Terminal one-liner:**
```bash
npx serve .
```
Then open the URL it prints (usually `http://localhost:3000`).

---

## 2 · Make the RSVP actually reach you (5 minutes)

Right now the form runs in **demo mode** — it shows the success screen but
sends nothing. To receive real RSVPs by email:

1. Go to **[formspree.io](https://formspree.io)** and create a free account.
2. Click **"+ New form"**, name it anything ("birthday"), use your email.
3. Formspree gives you an endpoint URL like `https://formspree.io/f/abcdwxyz`.
4. Open `js/main.js`, find this line near the top:
   ```js
   const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
   ```
   Replace it with your URL. Save. That's it — every RSVP now lands in
   your inbox (name, yes/no, +1, message).

The free tier allows 50 submissions/month — fine for a birthday.

---

## 3 · How to put it on the internet

**Recommendation: Vercel** — free, fast, zero configuration, and it
auto-updates whenever this GitHub repo changes.

### Why Vercel over the others
| Option | Verdict |
|---|---|
| **Vercel** ✅ | Free, connects to this GitHub repo, redeploys automatically on every change, easy custom domains. |
| **Netlify** | Equally good, nearly identical. Pick either; instructions below work the same way. |
| **GitHub Pages** | Free but clunkier setup and slower updates. |
| **Framer** | A design tool with hosting — you can't paste a custom-coded project like this into it. Not applicable. |

### Steps (one-time, ~5 minutes)
1. Go to **[vercel.com](https://vercel.com)** → **Sign up** → choose
   **"Continue with GitHub"** (use the account that owns this repo).
2. Click **"Add New… → Project"**.
3. You'll see a list of your GitHub repos. Click **"Import"** next to `entropia`.
4. Don't change any settings (it's a static site, Vercel detects this). Click **"Deploy"**.
5. ~30 seconds later you get a live URL like `entropia.vercel.app`.
   Send it to literally everyone.

From now on: **any change pushed to the repo's main branch goes live
automatically.** No re-deploying, ever.

### Custom domain (optional)
1. Buy a domain anywhere (Namecheap, GoDaddy, papaki.gr — ~10€/yr).
   Something like `entropia26.gr` or `glamonthebeach.com`.
2. In Vercel: your project → **Settings → Domains → Add**.
3. Vercel shows you 1–2 DNS records to add at your domain provider
   (a screen-by-screen guide appears right there). Add them, wait
   a few minutes, done — HTTPS included automatically.

---

## 4 · How to change things later

Everything a human would want to edit lives in `index.html` (all the copy)
and the top of `css/style.css` (all the colors, in the `:root` block).

- **Change copy:** edit the text in `index.html`, push, Vercel redeploys.
- **Change colors:** edit the hex values in `:root` at the top of `style.css`.
- **Change the schedule:** the cards are in the `<!-- ACT IV -->` block.
- **Change how fast night falls:** in `js/main.js`, the scroll→time mapping
  is in the `ScrollTrigger.create` block (the `10 * 60` is "ten hours").

## 5 · Maintenance

There is none. Static sites don't break, don't need updates, and Vercel's
free tier doesn't expire. After the party you can leave it up forever as
a souvenir, or delete the project in Vercel with one click.
