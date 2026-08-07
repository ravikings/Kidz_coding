#!/usr/bin/env node
/* =========================================================================
   embed-music.js — renders an original royalty-free 8-bit chiptune to a mono
   8-bit WAV, base64-encodes it, and injects it into index.html at the
   `__PARTY_MUSIC_SRC__` marker (or replaces an already-embedded data URI).

   The tune is our own composition, so it is unencumbered/royalty-free. Run:
       node tools/embed-music.js
   Re-run any time to regenerate/replace the embedded track.
   ========================================================================= */
const fs = require("fs");
const path = require("path");

const SR = 11025;                 // sample rate (lo-fi, authentically 8-bit)
const BPM = 120;
const EIGHTH = 30 / BPM;          // seconds per eighth note (0.25s)
const EIGHTH_N = Math.round(EIGHTH * SR);
const BARS = 8;
const STEPS = BARS * 8;           // eighth-note steps
const TOTAL_N = STEPS * EIGHTH_N;

const buf = new Float32Array(TOTAL_N);

const NOTE = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98,
};

// Short attack / short release envelope so notes don't click.
function env(i, n) {
  const atk = Math.min(40, n * 0.1);
  const rel = Math.min(240, n * 0.25);
  if (i < atk) return i / atk;
  if (i > n - rel) return Math.max(0, (n - i) / rel);
  return 1;
}

function addSquare(startN, durN, freq, amp, duty = 0.5) {
  if (!freq) return;
  const period = SR / freq;
  for (let i = 0; i < durN; i++) {
    const idx = startN + i;
    if (idx >= TOTAL_N) break;
    const phase = (i % period) / period;
    buf[idx] += (phase < duty ? amp : -amp) * env(i, durN);
  }
}

function addNoise(startN, durN, amp, decay = 1) {
  for (let i = 0; i < durN; i++) {
    const idx = startN + i;
    if (idx >= TOTAL_N) break;
    const e = Math.pow(1 - i / durN, decay);
    buf[idx] += (Math.random() * 2 - 1) * amp * e;
  }
}

function addKick(startN) {
  const durN = Math.round(0.12 * SR);
  for (let i = 0; i < durN; i++) {
    const idx = startN + i;
    if (idx >= TOTAL_N) break;
    const t = i / durN;
    const freq = 150 - 100 * t;               // 150 -> 50 Hz drop
    const period = SR / freq;
    const phase = (i % period) / period;
    buf[idx] += (phase < 0.5 ? 0.9 : -0.9) * Math.pow(1 - t, 1.5);
  }
}

// A catchy 4-bar hook (8 eighths/bar). "-" = rest/hold. Two passes = 8 bars,
// with a small turnaround on the final bar.
const MEL_A = [
  "G5", "-", "E5", "G5", "C6", "-", "G5", "-",   // C
  "A5", "-", "E5", "A5", "C6", "-", "A5", "-",   // Am
  "A5", "-", "F5", "A5", "C6", "-", "A5", "-",   // F
  "B5", "-", "G5", "D6", "B5", "-", "G5", "-",   // G
];
const MEL_B = [
  "E6", "-", "C6", "E6", "G5", "-", "E6", "-",   // C
  "C6", "-", "A5", "C6", "E6", "-", "C6", "-",   // Am
  "C6", "-", "A5", "F5", "A5", "-", "C6", "-",   // F
  "D6", "-", "B5", "G5", "D6", "-", "G6", "G6",  // G (turnaround)
];
const MEL = MEL_A.concat(MEL_B);
const BASS_ROOTS = ["C2", "A2", "F2", "G2", "C2", "A2", "F2", "G2"];

for (let s = 0; s < STEPS; s++) {
  const startN = s * EIGHTH_N;
  const inBar = s % 8;
  const barIdx = Math.floor(s / 8);

  // Drums: four-on-the-floor kick, snare backbeat, hats every eighth
  if (inBar % 2 === 0) addKick(startN);
  if (inBar === 2 || inBar === 6) addNoise(startN, Math.round(0.16 * SR), 0.35, 2);
  addNoise(startN, Math.round(0.04 * SR), inBar % 2 === 1 ? 0.14 : 0.07, 3);

  // Bouncy oom-pah bass: root on the beat, octave-up on the offbeat
  const root = NOTE[BASS_ROOTS[barIdx]];
  addSquare(startN, Math.round(EIGHTH_N * 0.9), inBar % 2 === 0 ? root : root * 2, 0.28, 0.5);

  // Lead melody
  const m = MEL[s];
  if (m && m !== "-") addSquare(startN, Math.round(EIGHTH_N * 1.7), NOTE[m], 0.22, 0.5);
}

// Normalize to avoid clipping, then convert to 8-bit unsigned PCM.
let peak = 0;
for (let i = 0; i < TOTAL_N; i++) peak = Math.max(peak, Math.abs(buf[i]));
const norm = peak > 0 ? 0.92 / peak : 1;
const pcm = Buffer.alloc(TOTAL_N);
for (let i = 0; i < TOTAL_N; i++) {
  let v = Math.round(buf[i] * norm * 127) + 128;
  pcm[i] = Math.max(0, Math.min(255, v));
}

// WAV header (PCM, 8-bit, mono)
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + TOTAL_N, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);       // fmt chunk size
header.writeUInt16LE(1, 20);        // PCM
header.writeUInt16LE(1, 22);        // mono
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR, 28);       // byte rate (SR * 1 byte)
header.writeUInt16LE(1, 32);        // block align
header.writeUInt16LE(8, 34);        // bits per sample
header.write("data", 36);
header.writeUInt32LE(TOTAL_N, 40);

const wav = Buffer.concat([header, pcm]);
const dataUri = "data:audio/wav;base64," + wav.toString("base64");

// Inject into index.html: replace the marker OR a previously embedded URI.
const htmlPath = path.join(__dirname, "..", "index.html");
let html = fs.readFileSync(htmlPath, "utf8");
const re = /const PARTY_MUSIC_SRC = "(?:__PARTY_MUSIC_SRC__|data:audio\/wav;base64,[^"]*)";/;
if (!re.test(html)) {
  console.error("Could not find PARTY_MUSIC_SRC assignment to inject into.");
  process.exit(1);
}
html = html.replace(re, 'const PARTY_MUSIC_SRC = "' + dataUri + '";');
fs.writeFileSync(htmlPath, html);
console.log(
  `Embedded ${(wav.length / 1024).toFixed(1)}KB WAV (${(dataUri.length / 1024).toFixed(1)}KB base64), ` +
  `${(TOTAL_N / SR).toFixed(1)}s, ${SR}Hz 8-bit mono.`
);
