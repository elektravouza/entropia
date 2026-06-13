// ============================================================
// ENTROPIA — main orchestration · v2
// Lenis (liquid scroll) + GSAP ScrollTrigger (choreography)
// + Sky (WebGL) + Beach (audio). Scroll = the day of the
// party: daylight at the top, deep night at the RSVP.
// ============================================================

import gsap from "./vendor/index.js";
import { ScrollTrigger } from "./vendor/ScrollTrigger.js";
import Lenis from "./vendor/lenis.mjs";
import { Sky } from "./scene.js";
import { Beach } from "./audio.js";

gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------
// RSVP backend — Google Sheet via Apps Script.
// Each RSVP is appended as a row (timestamp, attendance, name,
// +1, message). The sheet exports to CSV any time:
//   File → Download → Comma-separated values (.csv)
// Paste your deployed Web App URL below (ends with /exec).
// Full setup steps are in GOOGLE_SHEET_SETUP.md.
// Until you do, the form runs in demo mode (shows success,
// sends nothing).
// ------------------------------------------------------------
const SHEET_ENDPOINT = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

const sky = new Sky(document.getElementById("webgl"));
const beach = new Beach();

// ---------- her face ----------
// tries her photo first, then face.png, then the drawn fallback.
const FACE_SOURCES = ["assets/ME (1) 1.png", "assets/face.png", "assets/face-fallback.svg"];
let faceSrc = FACE_SOURCES[0];

// figure out which source actually exists, then upgrade every face
const facesReady = (async () => {
  for (const src of FACE_SOURCES) {
    const ok = await new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve(true);
      probe.onerror = () => resolve(false);
      probe.src = src;
    });
    if (ok) { faceSrc = src; break; }
  }
  document.querySelectorAll(".face-img").forEach((img) => (img.src = faceSrc));
})();

// ---------- smooth scroll ----------
const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

document.body.classList.add("locked");
lenis.stop();

// ---------- the gate: she multiplies until she owns the screen ----------
const gate = document.getElementById("gate");
const soundToggle = document.getElementById("soundToggle");
const soundLabel = document.getElementById("soundLabel");

facesReady.then(() => {
  const pop = document.getElementById("gatePop");
  const COUNT = 30;
  for (let i = 0; i < COUNT; i++) {
    const f = document.createElement("img");
    f.src = faceSrc;
    f.alt = "";
    // they start small and scattered, end huge — full takeover
    const size = gsap.utils.interpolate(16, 58, i / (COUNT - 1)) + gsap.utils.random(-4, 4);
    f.style.width = size + "vmin";
    f.style.left = gsap.utils.random(-8, 82) + "vw";
    f.style.top = gsap.utils.random(-6, 78) + "vh";
    if (Math.random() > 0.5) f.style.scale = "-1 1";
    pop.appendChild(f);
    gsap.fromTo(
      f,
      { scale: 0, rotation: gsap.utils.random(-60, 60), opacity: 0 },
      { scale: 1, rotation: gsap.utils.random(-16, 16), opacity: 1, duration: 0.55, ease: "back.out(1.8)", delay: 0.4 + i * 0.1 }
    );
  }
  // …and then the button gets the last word
  gsap.to("#gatePanel", {
    opacity: 1,
    scale: 1,
    duration: 0.7,
    ease: "back.out(1.7)",
    delay: 0.4 + COUNT * 0.1 + 0.3,
  });
});

document.getElementById("enterBtn").addEventListener("click", () => {
  beach.start();
  soundToggle.classList.add("on");
  soundLabel.textContent = "sound on";

  gsap.to(gate, {
    yPercent: -100,
    duration: 1.1,
    ease: "power4.inOut",
    onComplete: () => gate.remove(),
  });
  document.body.classList.remove("locked");
  lenis.start();
  soundToggle.classList.add("visible");

  // hero intro: the 26 crashes in
  gsap.fromTo(
    ".hero__digit",
    { yPercent: 110, rotate: 12, opacity: 0 },
    { yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, stagger: 0.12, ease: "back.out(1.4)", delay: 0.5 }
  );
  gsap.fromTo(
    ".hero [data-reveal]",
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 1.1 }
  );
});

soundToggle.addEventListener("click", () => {
  const on = beach.toggle();
  soundToggle.classList.toggle("on", on);
  soundLabel.textContent = on ? "sound on" : "sound off";
});

// ---------- scroll = time of day (slow fade into night) ----------
// lenis reports overall progress (0 at top, 1 at the RSVP) on
// every scroll frame — the sky reads the time of day from it.
lenis.on("scroll", (e) => {
  if (typeof e.progress === "number" && !Number.isNaN(e.progress)) {
    sky.setProgress(e.progress);
  }
});

// ---------- generic reveals (everything except hero) ----------
gsap.utils.toArray("section:not(.hero) [data-reveal]").forEach((el) => {
  gsap.to(el, {
    y: 0,
    opacity: 1,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 82%" },
  });
});

// ---------- ambient chaos: tags, glyphs & scribbles drift ----------
gsap.utils.toArray(".deco, .tag--light").forEach((el) => {
  gsap.to(el, {
    y: () => gsap.utils.random(-14, 14),
    rotation: () => gsap.utils.random(-6, 6),
    duration: gsap.utils.random(2.2, 4),
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
});

gsap.utils.toArray(".scribble path").forEach((path) => {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  gsap.to(path, {
    strokeDashoffset: 0,
    ease: "none",
    scrollTrigger: { trigger: path.closest("section"), start: "top 75%", end: "bottom 60%", scrub: 0.5 },
  });
});

// ---------- hero zoom-through on exit ----------
gsap.to(".hero__center", {
  scale: 2.4,
  opacity: 0,
  filter: "blur(8px)",
  ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
});

// ---------- manifesto: pinned, line by line ----------
const lines = gsap.utils.toArray(".manifesto__line");
const manifestoTl = gsap.timeline({
  scrollTrigger: {
    trigger: ".manifesto",
    start: "top top",
    end: "bottom bottom",
    pin: ".manifesto__pin",
    scrub: 0.6,
  },
});
lines.forEach((line, i) => {
  manifestoTl
    .fromTo(line, { opacity: 0, scale: 0.9, yPercent: 8 }, { opacity: 1, scale: 1, yPercent: 0, duration: 1 })
    .to(line, { opacity: 0, scale: 1.08, yPercent: -8, duration: 1 }, i === lines.length - 1 ? "+=1.2" : "+=0.6");
});

// ---------- stickers ----------
document.querySelectorAll("[data-flip]").forEach((sticker) => {
  sticker.addEventListener("click", () => {
    sticker.classList.toggle("flipped");
    beach.blip(sticker.classList.contains("flipped") ? 880 : 520);
  });
  gsap.to(sticker, {
    y: () => gsap.utils.random(-12, 12),
    duration: gsap.utils.random(2.4, 3.4),
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
});

gsap.from(".sticker, .itme", {
  scale: 0,
  rotate: () => gsap.utils.random(-40, 40),
  stagger: 0.12,
  duration: 0.9,
  ease: "back.out(1.6)",
  scrollTrigger: { trigger: ".details__field", start: "top 78%" },
});

// ---------- program: vertical scroll drives horizontal travel ----------
const track = document.getElementById("itineraryTrack");
gsap.to(track, {
  x: () => -(track.scrollWidth - window.innerWidth + 48),
  ease: "none",
  scrollTrigger: {
    trigger: ".itinerary",
    start: "top top",
    end: "bottom bottom",
    pin: ".itinerary__pin",
    scrub: 0.5,
    invalidateOnRefresh: true,
  },
});

// ---------- the form breathes (busy moving bold fields) ----------
gsap.utils.toArray(".wiggle").forEach((el, i) => {
  gsap.to(el, {
    rotation: i % 2 ? 0.8 : -0.8,
    y: () => gsap.utils.random(-4, 4),
    duration: gsap.utils.random(1.8, 2.6),
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
});

// ---------- RSVP ----------
const form = document.getElementById("rsvpForm");
const done = document.getElementById("rsvpDone");
const doneText = document.getElementById("rsvpDoneText");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "consulting the stars…";

  const data = Object.fromEntries(new FormData(form).entries());
  const isDemo = SHEET_ENDPOINT.includes("YOUR_DEPLOYMENT_ID");

  try {
    if (!isDemo) {
      // Apps Script Web Apps don't return CORS headers, so we send a
      // "simple" text/plain request in no-cors mode. The row still lands
      // in the sheet; the response is opaque, so we treat a completed
      // fetch (no network error) as success.
      await fetch(SHEET_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
      });
    } else {
      console.warn("ENTROPIA: demo mode — no Google Sheet endpoint set, RSVP not actually sent. See GOOGLE_SHEET_SETUP.md.");
      await new Promise((r) => setTimeout(r, 900));
    }

    form.hidden = true;
    done.hidden = false;
    if (data.attendance === "NO") {
      doneText.innerHTML = "noted. your absence is mathematically significant<br /><em>and emotionally devastating. reconsider.</em>";
    }
    beach.fanfare();
    confetti();
    faceRain();

    // the birthday girl spins in, judges you, settles
    gsap.fromTo(
      "#bigFace",
      { scale: 0, rotation: -540 },
      { scale: 1, rotation: 0, duration: 1.4, ease: "elastic.out(1, 0.45)" }
    );
    gsap.to("#bigFace", {
      rotation: 8,
      yoyo: true,
      repeat: -1,
      duration: 0.9,
      ease: "sine.inOut",
      delay: 1.5,
    });
    gsap.from(".rsvp__doneTitle, .rsvp__doneText", {
      y: 30,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      delay: 0.5,
      ease: "back.out(1.6)",
    });
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = "that didn't work — try again";
  }
});

function confetti() {
  const colors = ["#ecfd06", "#f52d93", "#3d39ea", "#fb92d0", "#f4f1ea"];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement("div");
    c.className = "confetto";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[(Math.random() * colors.length) | 0];
    document.body.appendChild(c);
    gsap.to(c, {
      y: window.innerHeight * 1.2,
      x: gsap.utils.random(-120, 120),
      rotation: gsap.utils.random(-720, 720),
      duration: gsap.utils.random(1.6, 3.2),
      delay: Math.random() * 0.6,
      ease: "power1.in",
      onComplete: () => c.remove(),
    });
  }
}

// it's raining birthday girl
function faceRain() {
  const src = document.getElementById("bigFace").src;
  for (let i = 0; i < 18; i++) {
    const f = document.createElement("img");
    f.className = "faceconfetto";
    f.src = src;
    f.style.left = Math.random() * 92 + "vw";
    if (Math.random() > 0.5) f.style.transform = "scaleX(-1)";
    document.body.appendChild(f);
    gsap.to(f, {
      y: window.innerHeight * 1.4,
      rotation: gsap.utils.random(-540, 540),
      duration: gsap.utils.random(2.2, 4),
      delay: Math.random() * 1.4,
      ease: "power1.in",
      onComplete: () => f.remove(),
    });
  }
}

// keep pin math honest after fonts/images settle
window.addEventListener("load", () => ScrollTrigger.refresh());

// debug handle (harmless in production)
window.__entropia = { sky, ScrollTrigger, lenis };
