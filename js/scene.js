// ============================================================
// ENTROPIA — WebGL sky
// One full-screen shader: afternoon → sunset → night,
// a wobbly sun that sets as you scroll, glitter that
// becomes stars. Scroll progress (0–1) drives everything.
// ============================================================

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uProgress;   // 0 = 17:00, 1 = deep night
  uniform vec2  uResolution;
  uniform vec2  uMouse;

  // --- tiny noise toolkit ---
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    // ---- three sky palettes (top / bottom) ----
    vec3 dayTop      = vec3(0.30, 0.62, 1.00);
    vec3 dayBot      = vec3(0.78, 0.92, 1.00);
    vec3 sunsetTop   = vec3(0.36, 0.16, 0.55);
    vec3 sunsetBot   = vec3(1.00, 0.36, 0.18);
    vec3 nightTop    = vec3(0.03, 0.03, 0.10);
    vec3 nightBot    = vec3(0.10, 0.07, 0.24);

    // phase blending, stretched so night arrives slowly:
    // day -> sunset (0.08..0.6), sunset -> night (0.62..0.97)
    float p1 = smoothstep(0.08, 0.60, uProgress);
    float p2 = smoothstep(0.62, 0.97, uProgress);

    vec3 top = mix(mix(dayTop, sunsetTop, p1), nightTop, p2);
    vec3 bot = mix(mix(dayBot, sunsetBot, p1), nightBot, p2);

    // slow drifting color turbulence so the sky feels alive
    float drift = noise(uv * 3.0 + uTime * 0.05) * 0.08;
    vec3 sky = mix(bot, top, clamp(uv.y + drift - 0.04, 0.0, 1.0));

    // gentle mouse-follow glow (subtle, like heat on the lens)
    vec2 m = uMouse;
    float mglow = exp(-distance(vec2(uv.x * aspect, uv.y), vec2(m.x * aspect, m.y)) * 3.0);
    sky += vec3(1.0, 0.8, 0.6) * mglow * 0.07 * (1.0 - p2 * 0.6);

    // ---- the sun: starts high, melts below the horizon ----
    float sunY = mix(0.62, -0.25, smoothstep(0.05, 0.82, uProgress));
    vec2 sunPos = vec2(0.5 * aspect, sunY);
    vec2 pos = vec2(uv.x * aspect, uv.y);
    float d = distance(pos, sunPos);

    // wobbly edge — the sun is also having a long day
    float wobble = noise(vec2(atan(pos.y - sunPos.y, pos.x - sunPos.x) * 2.5, uTime * 0.35)) * 0.025;
    float radius = 0.16 + wobble;

    float sunCore = smoothstep(radius, radius - 0.012, d);
    float sunHalo = exp(-d * 4.5) * 0.55;

    vec3 sunColDay    = vec3(1.00, 0.95, 0.78);
    vec3 sunColSunset = vec3(1.00, 0.30, 0.15);
    vec3 sunCol = mix(sunColDay, sunColSunset, p1);

    float sunFade = 1.0 - smoothstep(0.72, 0.85, uProgress);
    sky = mix(sky, sunCol, sunCore * sunFade);
    sky += sunCol * sunHalo * sunFade;

    // ---- sea: bottom band with moving ripple highlights ----
    float seaLine = 0.22;
    if (uv.y < seaLine) {
      float ripple = noise(vec2(uv.x * 40.0, uv.y * 90.0 - uTime * 0.6));
      vec3 seaDay    = vec3(0.10, 0.45, 0.62);
      vec3 seaSunset = vec3(0.30, 0.10, 0.25);
      vec3 seaNight  = vec3(0.02, 0.04, 0.10);
      vec3 sea = mix(mix(seaDay, seaSunset, p1), seaNight, p2);
      sea += sunCol * ripple * 0.18 * sunFade * (1.0 - uv.y / seaLine);
      sea += vec3(ripple) * 0.05;
      float shore = smoothstep(seaLine, seaLine - 0.015, uv.y);
      sky = mix(sky, sea, shore);
    }

    // ---- stars fade in at night ----
    float star = step(0.997, hash(floor(pos * 220.0)));
    float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + hash(floor(pos * 220.0)) * 50.0);
    sky += vec3(star * twinkle) * p2 * step(seaLine, uv.y);

    // vignette + dither
    float vig = smoothstep(1.25, 0.45, length(uv - 0.5) * 1.4);
    sky *= mix(0.85, 1.0, vig);
    sky += (hash(uv * uTime) - 0.5) * 0.02;

    gl_FragColor = vec4(sky, 1.0);
  }
`;

export class Sky {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.6) },
    };

    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: this.uniforms })
    );
    this.scene.add(quad);

    this.targetMouse = new THREE.Vector2(0.5, 0.6);
    this.targetProgress = 0;

    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointermove", (e) => {
      this.targetMouse.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    });

    this.resize();
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.uniforms.uResolution.value.set(w, h);
  }

  setProgress(p) {
    this.targetProgress = p;
  }

  tick() {
    const u = this.uniforms;
    u.uTime.value = this.clock.getElapsedTime();
    // ease toward targets so scroll & mouse feel liquid, not twitchy
    u.uProgress.value += (this.targetProgress - u.uProgress.value) * 0.06;
    u.uMouse.value.lerp(this.targetMouse, 0.05);
    this.renderer.render(this.scene, this.camera);
  }
}
