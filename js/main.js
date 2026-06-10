// ============================================================
// ENTROPIA — main orchestration
// Lenis (liquid scroll) + GSAP ScrollTrigger (choreography)
// + Sky (WebGL) + Beach (audio). Scroll = the day of the
// party: 17:00 daylight at the top, deep night at the RSVP.
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

// ---------- smooth scroll ----------
const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

document.body.classList.add("locked");
lenis.stop();

// ---------- the gate ----------
const gate = document.getElementById("gate");
const soundToggle = document.getElementById("soundToggle");
const soundLabel = document.getElementById("soundLabel");
const clock = document.getElementById("dayClock");

function enter(withSound) {
  if (withSound) {
    beach.start();
    soundToggle.classList.add("on");
    soundLabel.textContent = "sound on";
  }
  gsap.to(gate, {
    yPercent: -100,
    duration: 1.1,
    ease: "power4.inOut",
    onComplete: () => gate.remove(),
  });
  document.body.classList.remove("locked");
  lenis.start();
  soundToggle.classList.add("visible");
  clock.classList.add("visible");

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
}

document.getElementById("enterSound").addEventListener("click", () => enter(true));
document.getElementById("enterMute").addEventListener("click", () => enter(false));

soundToggle.addEventListener("click", () => {
  const on = beach.toggle();
  soundToggle.classList.toggle("on", on);
  soundLabel.textContent = on ? "sound on" : "sound off";
});

// ---------- scroll = time of day ----------
// 0% scroll → 17:00, 100% scroll → 03:00. The sky and the
// little corner clock both read from this.
ScrollTrigger.create({
  trigger: document.body,
  start: "top top",
  end: "bottom bottom",
  onUpdate: (self) => {
    sky.setProgress(self.progress);
    const minutes = 17 * 60 + self.progress * 10 * 60; // 17:00 + 10h
    const h = Math.floor(minutes / 60) % 24;
    const m = Math.floor(minutes % 60);
    clock.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  },
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

gsap.from(".sticker", {
  scale: 0,
  rotate: () => gsap.utils.random(-40, 40),
  stagger: 0.12,
  duration: 0.9,
  ease: "back.out(1.6)",
  scrollTrigger: { trigger: ".details__field", start: "top 78%" },
});

// ---------- itinerary: vertical scroll drives horizontal travel ----------
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
    gsap.from(done, { scale: 0.7, opacity: 0, duration: 0.8, ease: "back.out(1.8)" });
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = "that didn't work — try again";
  }
});

function confetti() {
  const colors = ["#c8ff1e", "#ff2e2e", "#4da6ff", "#ff7ab6", "#f4f1ea"];
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

// keep pin math honest after fonts/images settle
window.addEventListener("load", () => ScrollTrigger.refresh());
