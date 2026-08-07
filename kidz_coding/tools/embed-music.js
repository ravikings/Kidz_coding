#!/usr/bin/env node
/* =========================================================================
   embed-music.js — renders 3 original royalty-free 8-bit chiptunes to mono
   8-bit WAVs, base64-encodes them, and injects them into index.html at the
   `__PARTY_MUSIC_TRACKS__` marker (or replaces an already-embedded array) as
   const PARTY_MUSIC_TRACKS = [{name, src}, ...].

   The tunes are our own compositions, so they are royalty-free. Run:
       node tools/embed-music.js
   Re-run any time to regenerate/replace the embedded tracks.
   ========================================================================= */
const fs = require("fs");
const path = require("path");

const SR = 11025;                 // sample rate (lo-fi, authentically 8-bit)

const NOTE = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98,
};

/* ---- Render one tune (config) to an 8-bit WAV Buffer ---- */
function render(cfg) {
  const eighthN = Math.round((30 / cfg.bpm) * SR);   // samples per eighth note
  const steps = cfg.mel.length;                       // 8 eighth-steps per bar
  const totalN = steps * eighthN;
  const buf = new Float32Array(totalN);

  function env(i, n) {
    const atk = Math.min(40, n * 0.1);
    const rel = Math.min(240, n * 0.25);
    if (i < atk) return i / atk;
    if (i > n - rel) return Math.max(0, (n - i) / rel);
    return 1;
  }
  function addSquare(startN, durN, freq, amp, duty) {
    if (!freq) return;
    const period = SR / freq;
    for (let i = 0; i < durN; i++) {
      const idx = startN + i;
      if (idx >= totalN) break;
      const phase = (i % period) / period;
      buf[idx] += (phase < duty ? amp : -amp) * env(i, durN);
    }
  }
  function addNoise(startN, durN, amp, decay) {
    for (let i = 0; i < durN; i++) {
      const idx = startN + i;
      if (idx >= totalN) break;
      buf[idx] += (Math.random() * 2 - 1) * amp * Math.pow(1 - i / durN, decay);
    }
  }
  function addKick(startN) {
    const durN = Math.round(0.12 * SR);
    for (let i = 0; i < durN; i++) {
      const idx = startN + i;
      if (idx >= totalN) break;
      const t = i / durN;
      const period = SR / (150 - 100 * t);
      const phase = (i % period) / period;
      buf[idx] += (phase < 0.5 ? 0.9 : -0.9) * Math.pow(1 - t, 1.5);
    }
  }

  for (let s = 0; s < steps; s++) {
    const startN = s * eighthN;
    const inBar = s % 8;
    const barIdx = Math.floor(s / 8);

    // Drums per style
    if (cfg.drums === "dance") {
      if (inBar % 2 === 0) addKick(startN);
      if (inBar === 2 || inBar === 6) addNoise(startN, Math.round(0.16 * SR), 0.35, 2);
      addNoise(startN, Math.round(0.04 * SR), inBar % 2 === 1 ? 0.14 : 0.07, 3);
    } else if (cfg.drums === "surf") {
      if (inBar === 0 || inBar === 4) addKick(startN);
      if (inBar === 2 || inBar === 6) addNoise(startN, Math.round(0.14 * SR), 0.32, 2);
      addNoise(startN, Math.round(0.05 * SR), inBar % 2 === 1 ? 0.17 : 0.08, 3);
    } else if (cfg.drums === "march") {
      if (inBar === 0 || inBar === 4) addKick(startN);
      if (inBar === 2 || inBar === 6) addNoise(startN, Math.round(0.13 * SR), 0.34, 2);
      if (inBar === 7) addNoise(startN, Math.round(0.10 * SR), 0.22, 4); // little roll
    }

    // Bouncy oom-pah bass: root on the beat, octave-up on the offbeat
    const root = NOTE[cfg.bass[barIdx % cfg.bass.length]];
    addSquare(startN, Math.round(eighthN * 0.9), inBar % 2 === 0 ? root : root * 2, 0.28, 0.5);

    // Lead melody
    const m = cfg.mel[s];
    if (m && m !== "-") addSquare(startN, Math.round(eighthN * 1.7), NOTE[m], 0.22, cfg.duty);
  }

  // Normalize, convert to 8-bit unsigned PCM
  let peak = 0;
  for (let i = 0; i < totalN; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const norm = peak > 0 ? 0.92 / peak : 1;
  const pcm = Buffer.alloc(totalN);
  for (let i = 0; i < totalN; i++) {
    pcm[i] = Math.max(0, Math.min(255, Math.round(buf[i] * norm * 127) + 128));
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + totalN, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);   // PCM
  header.writeUInt16LE(1, 22);   // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);   // 8-bit
  header.write("data", 36);
  header.writeUInt32LE(totalN, 40);
  return { wav: Buffer.concat([header, pcm]), seconds: totalN / SR };
}

/* ---- The 3 tunes (8 eighth-steps per bar; "-" = rest/hold) ---- */
const TRACKS = [
  {
    name: "🕺 Happy Dance",
    bpm: 120, duty: 0.5, drums: "dance",
    bass: ["C2", "A2", "F2", "G2"],
    mel: [
      "G5","-","E5","G5","C6","-","G5","-",
      "A5","-","E5","A5","C6","-","A5","-",
      "A5","-","F5","A5","C6","-","A5","-",
      "B5","-","G5","D6","B5","-","G5","-",
      "E6","-","C6","E6","G5","-","E6","-",
      "C6","-","A5","C6","E6","-","C6","-",
      "C6","-","A5","F5","A5","-","C6","-",
      "D6","-","B5","G5","D6","-","G6","G6",
    ],
  },
  {
    name: "🏄 Surf Party",
    bpm: 138, duty: 0.25, drums: "surf",
    bass: ["C2", "F2", "G2", "A2", "F2", "G2"],
    mel: [
      "E5","G5","A5","G5","E5","C5","E5","G5",
      "F5","A5","C6","A5","F5","A5","G5","F5",
      "G5","B5","D6","B5","G5","D5","G5","B5",
      "A5","C6","E6","C6","A5","E5","A5","C6",
      "C6","A5","F5","A5","C6","A5","F5","D5",
      "D6","B5","G5","D5","G5","B5","D6","G6",
    ],
  },
  {
    name: "🏆 Victory March",
    bpm: 112, duty: 0.5, drums: "march",
    bass: ["C2", "C2", "G2", "G2", "C2", "C2"],
    mel: [
      "G5","-","E5","G5","C6","-","-","-",
      "E5","G5","C6","-","E6","-","C6","-",
      "D5","-","B5","D6","G5","-","-","-",
      "D6","B5","G5","-","D6","-","B5","-",
      "C6","-","G5","C6","E6","-","G6","-",
      "G6","-","E6","C6","G5","-","C6","C6",
    ],
  },
];

const rendered = TRACKS.map((t) => {
  const { wav, seconds } = render(t);
  return { name: t.name, seconds, src: "data:audio/wav;base64," + wav.toString("base64"), bytes: wav.length };
});

const arrayLiteral =
  "[" +
  rendered.map((r) => `{name:${JSON.stringify(r.name)},src:${JSON.stringify(r.src)}}`).join(",") +
  "]";

const htmlPath = path.join(__dirname, "..", "index.html");
let html = fs.readFileSync(htmlPath, "utf8");
const re = /const PARTY_MUSIC_TRACKS = (?:__PARTY_MUSIC_TRACKS__|\[[\s\S]*?\]);/;
if (!re.test(html)) {
  console.error("Could not find PARTY_MUSIC_TRACKS assignment to inject into.");
  process.exit(1);
}
html = html.replace(re, "const PARTY_MUSIC_TRACKS = " + arrayLiteral + ";");
fs.writeFileSync(htmlPath, html);

const totalKB = rendered.reduce((a, r) => a + r.src.length, 0) / 1024;
rendered.forEach((r) =>
  console.log(`  ${r.name}: ${(r.bytes / 1024).toFixed(1)}KB WAV, ${r.seconds.toFixed(1)}s`)
);
console.log(`Embedded ${rendered.length} tracks (~${totalKB.toFixed(0)}KB base64 total).`);
