// ============================================================
// ENTROPIA — main orchestration · v2
// Lenis (liquid scroll) + GSAP ScrollTrigger (choreography)
// + Sky (WebGL) + Beach (audio). Scroll = the day of the
// party: daylight at the top, deep night at the RSVP.
// ============================================================

import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.7/+esm";
import { ScrollTrigger } from "https://cdn.jsdelivr.net/npm/gsap@3.12.7/ScrollTrigger.js/+esm";
import Lenis from "https://cdn.jsdelivr.net/npm/lenis@1.1.18/+esm";
import { Sky } from "./scene.js";
import { Beach } from "./audio.js";

gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------
// RSVP backend — paste your own Formspree endpoint here.
// Create a free form at https://formspree.io → copy the URL
// that looks like https://formspree.io/f/abcdwxyz
// Until you do, the form runs in demo mode (shows success,
// sends nothing). Full instructions in README.md.
// ------------------------------------------------------------
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

const sky = new Sky(document.getElementById("webgl"));
const beach = new Beach();

// ---------- her face: real photo or scribble fallback ----------
// every .face-img falls back to the drawn face until
// assets/face.png is uploaded (see README).
const FALLBACK_FACE = "assets/face-fallback.svg";
document.querySelectorAll(".face-img").forEach((img) => {
  img.addEventListener("error", () => {
    if (!img.src.endsWith(FALLBACK_FACE)) img.src = FALLBACK_FACE;
  }, { once: true });
});

// the bottom face marquee on the gate
const strip = document.getElementById("facestripTrack");
for (let i = 0; i < 24; i++) {
  const f = document.createElement("img");
  f.className = "face-img";
  f.src = "assets/face.png";
  f.alt = "";
  f.addEventListener("error", () => (f.src = FALLBACK_FACE), { once: true });
  strip.appendChild(f);
}

// ---------- smooth scroll ----------
const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

document.body.classList.add("locked");
lenis.stop();

// ---------- the gate: one button, sound comes with it ----------
const gate = document.getElementById("gate");
const soundToggle = document.getElementById("soundToggle");
const soundLabel = document.getElementById("soundLabel");

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
ScrollTrigger.create({
  trigger: document.body,
  start: "top top",
  end: "bottom bottom",
  onUpdate: (self) => sky.setProgress(self.progress),
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
  const isDemo = FORMSPREE_ENDPOINT.includes("YOUR_FORM_ID");

  try {
    if (!isDemo) {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("formspree said no");
    } else {
      console.warn("ENTROPIA: demo mode — no Formspree endpoint set, RSVP not actually sent. See README.md.");
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
  const colors = ["#c8ff1e", "#ff2e2e", "#4da6ff", "#ff7ab6", "#ff4fd2", "#f4f1ea"];
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
